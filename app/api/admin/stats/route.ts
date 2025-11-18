import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

    // Get comprehensive dashboard statistics
    const [
      totalUsers,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingReviews,
      openRedFlags,
      totalClusters,
      totalDocuments,
      usersByRole,
      projectsByStage,
      projectsByStatus,
      recentActivity,
    ] = await Promise.all([
      db.user.count(),
      db.project.count(),
      db.project.count({ where: { status: "ACTIVE" } }),
      db.project.count({ where: { status: "COMPLETED" } }),
      db.gateReview.count({ where: { isCompleted: false } }),
      db.redFlag.count({ where: { status: "OPEN" } }),
      db.cluster.count(),
      db.document.count(),
      db.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      db.project.groupBy({
        by: ["currentStage"],
        _count: true,
      }),
      db.project.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.activityLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              name: true,
              projectId: true,
            },
          },
        },
      }),
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalProjects,
        activeProjects,
        completedProjects,
        pendingReviews,
        openRedFlags,
        totalClusters,
        totalDocuments,
      },
      distributions: {
        usersByRole: usersByRole.map((item: any) => ({
          role: item.role,
          count: item._count,
        })),
        projectsByStage: projectsByStage.map((item: any) => ({
          stage: item.currentStage,
          count: item._count,
        })),
        projectsByStatus: projectsByStatus.map((item: any) => ({
          status: item.status,
          count: item._count,
        })),
      },
      recentActivity,
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
