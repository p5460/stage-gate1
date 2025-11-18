import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get dashboard analytics
    const [
      totalProjects,
      activeProjects,
      pendingReviews,
      redFlags,
      projectsByStage,
      projectsByStatus,
      recentActivities,
      gateDecisions,
      monthlyProjectCreation,
    ] = await Promise.all([
      db.project.count(),
      db.project.count({ where: { status: "ACTIVE" } }),
      db.gateReview.count({ where: { isCompleted: false } }),
      db.redFlag.count({ where: { status: "OPEN" } }),
      db.project.groupBy({
        by: ["currentStage"],
        _count: true,
      }),
      db.project.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              projectId: true,
            },
          },
        },
      }),
      db.gateReview.groupBy({
        by: ["decision"],
        _count: true,
        where: {
          decision: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      db.project.groupBy({
        by: ["createdAt"],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000), // Last 12 months
          },
        },
      }),
    ]);

    // Calculate approval rate
    const completedReviews = await db.gateReview.count({
      where: { isCompleted: true },
    });
    const approvedReviews = await db.gateReview.count({
      where: { isCompleted: true, decision: "GO" },
    });
    const approvalRate =
      completedReviews > 0
        ? Math.round((approvedReviews / completedReviews) * 100)
        : 0;

    const analytics = {
      overview: {
        totalProjects,
        activeProjects,
        pendingReviews,
        redFlags,
        approvalRate,
      },
      projectsByStage: projectsByStage.map((item: any) => ({
        stage: item.currentStage,
        count: item._count,
      })),
      projectsByStatus: projectsByStatus.map((item: any) => ({
        status: item.status,
        count: item._count,
      })),
      gateDecisions: gateDecisions.map((item: any) => ({
        decision: item.decision,
        count: item._count,
      })),
      recentActivities,
      monthlyProjectCreation: monthlyProjectCreation.map((item: any) => ({
        month: item.createdAt,
        count: item._count,
      })),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[DASHBOARD_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
