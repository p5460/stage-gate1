import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const projectIds = searchParams.get("projectIds")?.split(",");
    const format = searchParams.get("format") || "json";

    if (!projectId && !projectIds) {
      return NextResponse.json(
        { error: "Project ID or IDs required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let exportData: any;
    let filename: string = "";

    if (projectId) {
      // Single project export
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: {
          lead: {
            select: {
              name: true,
              email: true,
              department: true,
              position: true,
            },
          },
          cluster: {
            select: {
              name: true,
              description: true,
              color: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  department: true,
                  position: true,
                },
              },
            },
          },
          gateReviews: {
            include: {
              reviewer: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" as const },
          },
          documents: {
            select: {
              name: true,
              description: true,
              type: true,
              fileName: true,
              fileSize: true,
              isRequired: true,
              isApproved: true,
              version: true,
              createdAt: true,
              uploader: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" as const },
          },
          redFlags: {
            include: {
              raisedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" as const },
          },
          milestones: {
            orderBy: { dueDate: "asc" as const },
          },
          comments: {
            include: {
              author: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" as const },
          },
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      // Check access permissions
      const hasAccess =
        user.role === "ADMIN" ||
        user.role === "GATEKEEPER" ||
        project.leadId === session.user.id ||
        project.members.some(
          (member: any) => member.userId === session.user.id
        );

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      exportData = {
        ...project,
        exportedAt: new Date().toISOString(),
        exportedBy: {
          name: user.name,
          email: user.email,
        },
      };

      filename = `project-${project.projectId}-${new Date().toISOString().split("T")[0]}`;
    } else if (projectIds) {
      // Multiple projects export
      const whereClause =
        user.role === "ADMIN" || user.role === "GATEKEEPER"
          ? { id: { in: projectIds } }
          : {
              id: { in: projectIds },
              OR: [
                { leadId: session.user.id },
                { members: { some: { userId: session.user.id } } },
              ],
            };

      const projects = await db.project.findMany({
        where: whereClause,
        include: {
          lead: {
            select: {
              name: true,
              email: true,
            },
          },
          cluster: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              documents: true,
              redFlags: true,
              gateReviews: true,
              members: true,
              comments: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      exportData = {
        projects,
        exportedAt: new Date().toISOString(),
        exportedBy: {
          name: user.name,
          email: user.email,
        },
        totalProjects: projects.length,
      };

      filename = `projects-export-${new Date().toISOString().split("T")[0]}`;
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: projectId || null,
        action: projectId ? "PROJECT_EXPORTED" : "PROJECTS_BULK_EXPORTED",
        details: `Project${projectIds ? "s" : ""} exported in ${format.toUpperCase()} format`,
      },
    });

    if (format === "csv") {
      let csvData: string;

      if (projectId && exportData.members) {
        // Detailed single project CSV
        csvData = [
          // Project basic info
          "Section,Field,Value",
          `Project,ID,${exportData.projectId}`,
          `Project,Name,"${exportData.name}"`,
          `Project,Description,"${exportData.description || ""}"`,
          `Project,Status,${exportData.status}`,
          `Project,Stage,${exportData.currentStage}`,
          `Project,Budget,${exportData.budget || 0}`,
          `Project,Budget Utilization,${exportData.budgetUtilization || 0}%`,
          `Project,Duration,${exportData.duration || 0} months`,
          `Project,Technology Readiness,${exportData.technologyReadiness || ""}`,
          `Project,IP Potential,${exportData.ipPotential || ""}`,
          `Project,Start Date,${exportData.startDate?.split("T")[0] || ""}`,
          `Project,End Date,${exportData.endDate?.split("T")[0] || ""}`,
          `Project,Lead,${exportData.lead.name}`,
          `Project,Cluster,${exportData.cluster.name}`,
          "",
          // Team members
          "Team Members,Name,Email,Role",
          ...exportData.members.map(
            (member: any) =>
              `Team,"${member.user.name}",${member.user.email},"${member.role}"`
          ),
          "",
          // Gate reviews
          "Gate Reviews,Stage,Decision,Score,Reviewer,Date",
          ...exportData.gateReviews.map(
            (review: any) =>
              `Gate Review,${review.stage},${review.decision || "Pending"},${review.score || ""},"${review.reviewer.name}",${review.reviewDate?.split("T")[0] || ""}`
          ),
          "",
          // Documents
          "Documents,Name,Type,Status,Uploader,Date",
          ...exportData.documents.map(
            (doc: any) =>
              `Document,"${doc.name}",${doc.type},${doc.isApproved ? "Approved" : "Pending"},"${doc.uploader.name}",${doc.createdAt.split("T")[0]}`
          ),
          "",
          // Red flags
          "Red Flags,Title,Severity,Status,Raised By,Date",
          ...exportData.redFlags.map(
            (flag: any) =>
              `Red Flag,"${flag.title}",${flag.severity},${flag.status},"${flag.raisedBy.name}",${flag.createdAt.split("T")[0]}`
          ),
          "",
          // Milestones
          "Milestones,Title,Due Date,Progress,Status",
          ...exportData.milestones.map(
            (milestone: any) =>
              `Milestone,"${milestone.title}",${milestone.dueDate.split("T")[0]},${milestone.progress}%,${milestone.isCompleted ? "Completed" : "In Progress"}`
          ),
        ].join("\n");
      } else {
        // Multiple projects summary CSV
        csvData = [
          "ID,Name,Status,Stage,Budget,Utilization,Lead,Cluster,Documents,Red Flags,Gate Reviews,Members,Created,Updated",
          ...exportData.projects.map(
            (project: any) =>
              `${project.projectId},"${project.name}",${project.status},${project.currentStage},${project.budget || 0},${project.budgetUtilization || 0}%,"${project.lead.name}","${project.cluster.name}",${project._count.documents},${project._count.redFlags},${project._count.gateReviews},${project._count.members},${project.createdAt.split("T")[0]},${project.updatedAt.split("T")[0]}`
          ),
        ].join("\n");
      }

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `${filename}.json`,
    });
  } catch (error) {
    console.error("Error exporting project(s):", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectIds, format = "json", includeDetails = false } = body;

    if (!projectIds || !Array.isArray(projectIds)) {
      return NextResponse.json(
        { error: "Project IDs array required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query based on user permissions
    const whereClause =
      user.role === "ADMIN" || user.role === "GATEKEEPER"
        ? { id: { in: projectIds } }
        : {
            id: { in: projectIds },
            OR: [
              { leadId: session.user.id },
              { members: { some: { userId: session.user.id } } },
            ],
          };

    const includeClause = includeDetails
      ? {
          lead: {
            select: {
              name: true,
              email: true,
              department: true,
              position: true,
            },
          },
          cluster: {
            select: {
              name: true,
              description: true,
              color: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  department: true,
                  position: true,
                },
              },
            },
          },
          gateReviews: {
            include: {
              reviewer: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" as const },
          },
          documents: {
            select: {
              name: true,
              description: true,
              type: true,
              fileName: true,
              isRequired: true,
              isApproved: true,
              version: true,
              createdAt: true,
              uploader: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" as const },
          },
          redFlags: {
            include: {
              raisedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" as const },
          },
          milestones: {
            orderBy: { dueDate: "asc" as const },
          },
          _count: {
            select: {
              documents: true,
              redFlags: true,
              gateReviews: true,
              members: true,
              comments: true,
            },
          },
        }
      : {
          lead: {
            select: {
              name: true,
              email: true,
            },
          },
          cluster: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              documents: true,
              redFlags: true,
              gateReviews: true,
              members: true,
              comments: true,
            },
          },
        };

    const projects = await db.project.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { updatedAt: "desc" },
    });

    if (projects.length === 0) {
      return NextResponse.json(
        { error: "No accessible projects found" },
        { status: 404 }
      );
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "PROJECTS_BULK_EXPORTED",
        details: `${projects.length} projects exported in ${format.toUpperCase()} format`,
      },
    });

    const exportData = {
      projects,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        name: user.name,
        email: user.email,
      },
      totalProjects: projects.length,
      includeDetails,
    };

    const filename = `projects-export-${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      const csvData = [
        "ID,Name,Status,Stage,Budget,Utilization,Lead,Cluster,Documents,Red Flags,Gate Reviews,Members,Created,Updated",
        ...projects.map(
          (project: any) =>
            `${project.projectId},"${project.name}",${project.status},${project.currentStage},${project.budget || 0},${project.budgetUtilization || 0}%,"${project.lead.name}","${project.cluster.name}",${project._count.documents},${project._count.redFlags},${project._count.gateReviews},${project._count.members},${project.createdAt.toISOString().split("T")[0]},${project.updatedAt.toISOString().split("T")[0]}`
        ),
      ].join("\n");

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `${filename}.json`,
    });
  } catch (error) {
    console.error("Error bulk exporting projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
