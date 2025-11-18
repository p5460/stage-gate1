import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view clusters
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clusterId } = await params;
    const { searchParams } = new URL(request.url);
    const includeProjects = searchParams.get("includeProjects") !== "false";

    const cluster = await db.cluster.findUnique({
      where: { id: clusterId },
      include: {
        projects: includeProjects
          ? {
              select: {
                id: true,
                projectId: true,
                name: true,
                status: true,
                currentStage: true,
                budget: true,
                budgetUtilization: true,
                startDate: true,
                endDate: true,
                lead: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { updatedAt: "desc" },
            }
          : false,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!cluster) {
      return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cluster });
  } catch (error) {
    console.error("Error fetching cluster:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update clusters
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clusterId } = await params;
    const body = await request.json();
    const { name, description, color } = body;

    // Check if cluster exists
    const existingCluster = await db.cluster.findUnique({
      where: { id: clusterId },
    });

    if (!existingCluster) {
      return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existingCluster.name) {
      const nameExists = await db.cluster.findUnique({
        where: { name },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Cluster with this name already exists" },
          { status: 409 }
        );
      }
    }

    const cluster = await db.cluster.update({
      where: { id: clusterId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CLUSTER_UPDATED",
        details: `Cluster ${cluster.name} was updated`,
      },
    });

    return NextResponse.json({ success: true, cluster });
  } catch (error) {
    console.error("Error updating cluster:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to delete clusters (only ADMIN)
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clusterId } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const cluster = await db.cluster.findUnique({
      where: { id: clusterId },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!cluster) {
      return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
    }

    // Check if cluster has active projects
    if (cluster.projects.length > 0 && !force) {
      return NextResponse.json(
        {
          error: "Cannot delete cluster with active projects",
          projectCount: cluster.projects.length,
          projects: cluster.projects,
        },
        { status: 409 }
      );
    }

    // If force delete, we would need to handle projects first
    // For now, we'll prevent force delete if there are active projects
    if (force && cluster.projects.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete cluster with active projects. Use force delete to reassign projects.",
          projectCount: cluster.projects.length,
          projects: cluster.projects,
        },
        { status: 409 }
      );
    }

    await db.cluster.delete({
      where: { id: clusterId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CLUSTER_DELETED",
        details: `Cluster ${cluster.name} was deleted`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cluster:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
