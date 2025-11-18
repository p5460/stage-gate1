import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const budgetAllocationSchema = z.object({
  projectId: z.string().optional(),
  clusterId: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(["project", "cluster", "global"]),
  description: z.string().optional(),
  fiscalYear: z.number().optional(),
});

const bulkAllocationSchema = z.object({
  allocations: z.array(
    z.object({
      projectId: z.string().optional(),
      clusterId: z.string().optional(),
      amount: z.number().positive(),
      description: z.string().optional(),
    })
  ),
  type: z.enum(["project", "cluster"]),
  fiscalYear: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const isBulk = searchParams.get("bulk") === "true";

    if (isBulk) {
      // Handle bulk allocation
      const validation = bulkAllocationSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Invalid bulk allocation data",
            details: validation.error.issues,
          },
          { status: 400 }
        );
      }

      const { allocations, type, fiscalYear } = validation.data;
      const results = [];
      const errors = [];

      for (const allocation of allocations) {
        try {
          if (type === "project" && allocation.projectId) {
            // Update project budget
            const project = await db.project.update({
              where: { id: allocation.projectId },
              data: {
                budget: allocation.amount,
                updatedAt: new Date(),
              },
              include: {
                lead: { select: { name: true, email: true } },
                cluster: { select: { name: true } },
              },
            });

            // Log the budget allocation
            await db.activityLog.create({
              data: {
                action: "BUDGET_ALLOCATED",
                details: `Budget of ${new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                }).format(
                  allocation.amount
                )} allocated to project: ${project.name}`,
                userId: user.id,
                projectId: project.id,
              },
            });

            results.push({
              projectId: allocation.projectId,
              amount: allocation.amount,
              success: true,
            });
          } else if (type === "cluster" && allocation.clusterId) {
            // For cluster allocation, we'll update all projects in the cluster
            const cluster = await db.cluster.findUnique({
              where: { id: allocation.clusterId },
              include: { projects: true },
            });

            if (!cluster) {
              errors.push({
                clusterId: allocation.clusterId,
                error: "Cluster not found",
              });
              continue;
            }

            // Distribute budget equally among projects in cluster
            const budgetPerProject =
              allocation.amount / cluster.projects.length;

            await db.project.updateMany({
              where: { clusterId: allocation.clusterId },
              data: {
                budget: budgetPerProject,
                updatedAt: new Date(),
              },
            });

            // Log the cluster budget allocation
            await db.activityLog.create({
              data: {
                action: "CLUSTER_BUDGET_ALLOCATED",
                details: `Budget of ${new Intl.NumberFormat("en-ZA", {
                  style: "currency",
                  currency: "ZAR",
                }).format(
                  allocation.amount
                )} allocated to cluster: ${cluster.name} (${budgetPerProject.toFixed(2)} per project)`,
                userId: user.id,
              },
            });

            results.push({
              clusterId: allocation.clusterId,
              amount: allocation.amount,
              projectsUpdated: cluster.projects.length,
              success: true,
            });
          }
        } catch (error) {
          console.error("Error in bulk allocation:", error);
          errors.push({
            projectId: allocation.projectId,
            clusterId: allocation.clusterId,
            error: "Failed to allocate budget",
          });
        }
      }

      return NextResponse.json({
        success: true,
        results,
        errors,
        message: `Bulk allocation completed. ${results.length} successful, ${errors.length} failed.`,
      });
    } else {
      // Handle single allocation
      const validation = budgetAllocationSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Invalid allocation data",
            details: validation.error.issues,
          },
          { status: 400 }
        );
      }

      const { projectId, clusterId, amount, type, description, fiscalYear } =
        validation.data;

      if (type === "project" && projectId) {
        // Allocate budget to specific project
        const project = await db.project.update({
          where: { id: projectId },
          data: {
            budget: amount,
            updatedAt: new Date(),
          },
          include: {
            lead: { select: { name: true, email: true } },
            cluster: { select: { name: true } },
          },
        });

        // Log the allocation
        await db.activityLog.create({
          data: {
            action: "BUDGET_ALLOCATED",
            details:
              description ||
              `Budget of ${new Intl.NumberFormat("en-ZA", {
                style: "currency",
                currency: "ZAR",
              }).format(amount)} allocated to project: ${project.name}`,
            userId: user.id,
            projectId: project.id,
          },
        });

        return NextResponse.json({
          success: true,
          project: {
            id: project.id,
            name: project.name,
            budget: project.budget,
            leadName: project.lead?.name,
            clusterName: project.cluster?.name,
          },
          message: "Budget allocated successfully to project",
        });
      } else if (type === "cluster" && clusterId) {
        // Allocate budget to all projects in cluster
        const cluster = await db.cluster.findUnique({
          where: { id: clusterId },
          include: {
            projects: {
              include: {
                lead: { select: { name: true } },
              },
            },
          },
        });

        if (!cluster) {
          return NextResponse.json(
            { error: "Cluster not found" },
            { status: 404 }
          );
        }

        if (cluster.projects.length === 0) {
          return NextResponse.json(
            { error: "No projects found in cluster" },
            { status: 400 }
          );
        }

        // Distribute budget equally among projects
        const budgetPerProject = amount / cluster.projects.length;

        await db.project.updateMany({
          where: { clusterId },
          data: {
            budget: budgetPerProject,
            updatedAt: new Date(),
          },
        });

        // Log the allocation
        await db.activityLog.create({
          data: {
            action: "CLUSTER_BUDGET_ALLOCATED",
            details:
              description ||
              `Budget of ${new Intl.NumberFormat("en-ZA", {
                style: "currency",
                currency: "ZAR",
              }).format(
                amount
              )} allocated to cluster: ${cluster.name} (${new Intl.NumberFormat(
                "en-ZA",
                {
                  style: "currency",
                  currency: "ZAR",
                }
              ).format(budgetPerProject)} per project)`,
            userId: user.id,
          },
        });

        return NextResponse.json({
          success: true,
          cluster: {
            id: cluster.id,
            name: cluster.name,
            totalBudget: amount,
            budgetPerProject,
            projectsUpdated: cluster.projects.length,
          },
          message: "Budget allocated successfully to cluster",
        });
      } else if (type === "global") {
        // Global budget allocation - distribute among all active projects
        const activeProjects = await db.project.findMany({
          where: { status: "ACTIVE" },
          include: {
            lead: { select: { name: true } },
            cluster: { select: { name: true } },
          },
        });

        if (activeProjects.length === 0) {
          return NextResponse.json(
            { error: "No active projects found for global allocation" },
            { status: 400 }
          );
        }

        const budgetPerProject = amount / activeProjects.length;

        await db.project.updateMany({
          where: { status: "ACTIVE" },
          data: {
            budget: budgetPerProject,
            updatedAt: new Date(),
          },
        });

        // Log the global allocation
        await db.activityLog.create({
          data: {
            action: "GLOBAL_BUDGET_ALLOCATED",
            details:
              description ||
              `Global budget of ${new Intl.NumberFormat("en-ZA", {
                style: "currency",
                currency: "ZAR",
              }).format(
                amount
              )} allocated across ${activeProjects.length} active projects (${new Intl.NumberFormat(
                "en-ZA",
                {
                  style: "currency",
                  currency: "ZAR",
                }
              ).format(budgetPerProject)} per project)`,
            userId: user.id,
          },
        });

        return NextResponse.json({
          success: true,
          allocation: {
            totalBudget: amount,
            budgetPerProject,
            projectsUpdated: activeProjects.length,
            fiscalYear,
          },
          message: "Global budget allocated successfully",
        });
      }

      return NextResponse.json(
        { error: "Invalid allocation type or missing required parameters" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error allocating budget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve budget allocation history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get budget allocation history from activity logs
    const allocations = await db.activityLog.findMany({
      where: {
        action: {
          in: [
            "BUDGET_ALLOCATED",
            "CLUSTER_BUDGET_ALLOCATED",
            "GLOBAL_BUDGET_ALLOCATED",
          ],
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        project: {
          select: { name: true, budget: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get current budget summary
    const budgetSummary = await db.project.aggregate({
      _sum: { budget: true },
      _avg: { budget: true, budgetUtilization: true },
      _count: { budget: true },
    });

    return NextResponse.json({
      success: true,
      allocations: allocations.map((allocation: any) => ({
        id: allocation.id,
        action: allocation.action,
        details: allocation.details,
        createdAt: allocation.createdAt,
        userName: allocation.user?.name,
        userEmail: allocation.user?.email,
        projectName: allocation.project?.name,
        projectBudget: allocation.project?.budget,
      })),
      summary: {
        totalBudget: budgetSummary._sum.budget || 0,
        averageBudget: budgetSummary._avg.budget || 0,
        averageUtilization: budgetSummary._avg.budgetUtilization || 0,
        projectsWithBudget: budgetSummary._count.budget,
      },
      pagination: {
        limit,
        offset,
        hasMore: allocations.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching budget allocations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
