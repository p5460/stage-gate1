import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const includeProjects = searchParams.get("includeProjects") === "true";
    const clusterId = searchParams.get("clusterId");

    if (clusterId) {
      // Get specific cluster
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
        return NextResponse.json(
          { error: "Cluster not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, cluster });
    }

    // Get all clusters
    const clusters = await db.cluster.findMany({
      include: {
        projects: includeProjects
          ? {
              select: {
                id: true,
                projectId: true,
                name: true,
                status: true,
                currentStage: true,
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, clusters });
  } catch (error) {
    console.error("Error fetching clusters:", error);
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

    // Check if user has permission to create clusters
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Cluster name is required" },
        { status: 400 }
      );
    }

    // Check if cluster already exists
    const existingCluster = await db.cluster.findUnique({
      where: { name },
    });

    if (existingCluster) {
      return NextResponse.json(
        { error: "Cluster with this name already exists" },
        { status: 409 }
      );
    }

    const cluster = await db.cluster.create({
      data: {
        name,
        description,
        color: color || "#3B82F6",
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
        action: "CLUSTER_CREATED",
        details: `New cluster ${cluster.name} created`,
      },
    });

    return NextResponse.json({ success: true, cluster });
  } catch (error) {
    console.error("Error creating cluster:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
