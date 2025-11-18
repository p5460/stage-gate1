import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "30"; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get comprehensive analytics data
    const [
      // Basic counts
      totalProjects,
      totalUsers,
      totalClusters,

      // Project analytics
      projectsByStage,
      projectsByStatus,
      projectsByCluster,

      // User analytics
      usersByRole,
      usersByDepartment,

      // Activity analytics
      recentActivities,
      activitiesByType,

      // Gate review analytics
      gateReviewStats,
      reviewsByDecision,

      // Budget analytics
      budgetAnalytics,
      budgetByCluster,

      // Time-based analytics
      projectsCreatedOverTime,
      activitiesOverTime,

      // Performance metrics
      avgProjectDuration,
      completionRates,
    ] = await Promise.all([
      // Basic counts
      db.project.count(),
      db.user.count(),
      db.cluster.count(),

      // Project analytics
      db.project.groupBy({
        by: ["currentStage"],
        _count: true,
      }),
      db.project.groupBy({
        by: ["status"],
        _count: true,
      }),
      // Get projects by cluster with names
      (async () => {
        try {
          const [projectsByCluster, clusters] = await Promise.all([
            db.project.groupBy({
              by: ["clusterId"],
              _count: true,
            }),
            db.cluster.findMany({
              select: { id: true, name: true },
            }),
          ]);

          const clusterMap = clusters.reduce(
            (acc: any, cluster: any) => {
              acc[cluster.id] = cluster.name;
              return acc;
            },
            {} as Record<string, string>
          );

          return projectsByCluster.map((item: any) => ({
            clusterId: item.clusterId,
            clusterName:
              clusterMap[item.clusterId] || `Cluster ${item.clusterId}`,
            _count: item._count,
          }));
        } catch (error) {
          console.error("Error fetching projects by cluster:", error);
          return [];
        }
      })(),

      // User analytics
      db.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      db.user
        .groupBy({
          by: ["department"],
          _count: true,
          where: {
            department: { not: null },
          },
        })
        .catch(() => []),

      // Activity analytics
      db.activityLog
        .count({
          where: {
            createdAt: { gte: startDate },
          },
        })
        .catch(() => 0),
      db.activityLog
        .groupBy({
          by: ["action"],
          _count: true,
          where: {
            createdAt: { gte: startDate },
          },
        })
        .catch(() => []),

      // Gate review analytics
      db.gateReview.count().catch(() => 0),
      db.gateReview
        .groupBy({
          by: ["decision"],
          _count: true,
          where: {
            decision: { not: null },
          },
        })
        .catch(() => []),

      // Budget analytics - Enhanced
      (async () => {
        try {
          const [projectBudgets, allocations, expenses] = await Promise.all([
            db.project.aggregate({
              _sum: { budget: true },
              _avg: { budget: true, budgetUtilization: true },
              _count: { budget: true },
            }),
            (db as any).budgetAllocation.aggregate({
              _sum: {
                allocatedAmount: true,
                spentAmount: true,
                remainingAmount: true,
              },
              _count: true,
            }),
            (db as any).budgetExpense.aggregate({
              _sum: { amount: true },
              _count: true,
            }),
          ]);

          const [allocationsByStatus, expensesByStatus, allocationsByCategory] =
            await Promise.all([
              (db as any).budgetAllocation.groupBy({
                by: ["status"],
                _count: true,
                _sum: { allocatedAmount: true },
              }),
              (db as any).budgetExpense.groupBy({
                by: ["status"],
                _count: true,
                _sum: { amount: true },
              }),
              (db as any).budgetAllocation.groupBy({
                by: ["category"],
                _count: true,
                _sum: { allocatedAmount: true, spentAmount: true },
              }),
            ]);

          return {
            projects: projectBudgets,
            allocations: {
              total: allocations._sum.allocatedAmount || 0,
              spent: allocations._sum.spentAmount || 0,
              remaining: allocations._sum.remainingAmount || 0,
              count: allocations._count || 0,
              byStatus: allocationsByStatus,
              byCategory: allocationsByCategory,
            },
            expenses: {
              total: expenses._sum.amount || 0,
              count: expenses._count || 0,
              byStatus: expensesByStatus,
            },
          };
        } catch (error) {
          console.error("Error fetching budget analytics:", error);
          return {
            projects: {
              _sum: { budget: 0 },
              _avg: { budget: 0, budgetUtilization: 0 },
              _count: { budget: 0 },
            },
            allocations: {
              total: 0,
              spent: 0,
              remaining: 0,
              count: 0,
              byStatus: [],
              byCategory: [],
            },
            expenses: { total: 0, count: 0, byStatus: [] },
          };
        }
      })(),
      // Get budget by cluster with names
      (async () => {
        try {
          const [budgetByCluster, clusters] = await Promise.all([
            db.project.groupBy({
              by: ["clusterId"],
              _sum: { budget: true },
              _avg: { budgetUtilization: true },
              _count: true,
              where: {
                budget: { not: null },
              },
            }),
            db.cluster.findMany({
              select: { id: true, name: true },
            }),
          ]);

          const clusterMap = clusters.reduce(
            (acc: any, cluster: any) => {
              acc[cluster.id] = cluster.name;
              return acc;
            },
            {} as Record<string, string>
          );

          return budgetByCluster.map((item: any) => ({
            clusterId: item.clusterId,
            clusterName:
              clusterMap[item.clusterId] || `Cluster ${item.clusterId}`,
            _sum: item._sum,
            _avg: item._avg,
            _count: item._count,
          }));
        } catch (error) {
          console.error("Error fetching budget by cluster:", error);
          return [];
        }
      })(),

      // Time-based analytics
      db.project
        .groupBy({
          by: ["createdAt"],
          _count: true,
          where: {
            createdAt: { gte: startDate },
          },
        })
        .catch(() => []),
      db.activityLog
        .groupBy({
          by: ["createdAt"],
          _count: true,
          where: {
            createdAt: { gte: startDate },
          },
        })
        .catch(() => []),

      // Performance metrics
      db.project
        .aggregate({
          _avg: { duration: true },
        })
        .catch(() => ({ _avg: { duration: 0 } })),
      db.project
        .count({
          where: { status: "COMPLETED" },
        })
        .catch(() => 0),
    ]);

    // Calculate additional metrics
    const completionRate =
      totalProjects > 0 ? (completionRates / totalProjects) * 100 : 0;
    const avgBudgetUtilization =
      budgetAnalytics.projects._avg.budgetUtilization || 0;

    // Process time-based data for charts
    const processTimeSeriesData = (data: any[], days: number) => {
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const count = data
          .filter((item) => {
            const itemDate = new Date(item.createdAt)
              .toISOString()
              .split("T")[0];
            return itemDate === dateStr;
          })
          .reduce((sum, item) => sum + item._count, 0);

        result.push({
          date: dateStr,
          count: count,
        });
      }
      return result;
    };

    const projectTrends = processTimeSeriesData(
      projectsCreatedOverTime,
      parseInt(timeRange)
    );
    const activityTrends = processTimeSeriesData(
      activitiesOverTime,
      parseInt(timeRange)
    );

    // Get top performers
    const topProjectLeads = await db.user
      .findMany({
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              projectsLed: true,
            },
          },
        },
        orderBy: {
          projectsLed: {
            _count: "desc",
          },
        },
        take: 5,
      })
      .catch(() => []);

    // Get system health metrics
    const systemHealth = {
      activeProjects:
        projectsByStatus.find((p: any) => p.status === "ACTIVE")?._count || 0,
      pendingReviews: await db.gateReview
        .count({
          where: { isCompleted: false },
        })
        .catch(() => 0),
      redFlags: await db.redFlag
        .count({
          where: { status: "OPEN" },
        })
        .catch(() => 0),
      recentLogins: await db.user
        .count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        })
        .catch(() => 0),
    };

    const analytics = {
      overview: {
        totalProjects,
        totalUsers,
        totalClusters,
        recentActivities,
        completionRate: Math.round(completionRate),
        avgProjectDuration: Math.round(avgProjectDuration._avg.duration || 0),
        totalBudget: budgetAnalytics.projects._sum.budget || 0,
        avgBudgetUtilization: Math.round(avgBudgetUtilization),
      },
      projects: {
        byStage: projectsByStage,
        byStatus: projectsByStatus,
        byCluster: projectsByCluster,
        trends: projectTrends,
      },
      users: {
        byRole: usersByRole,
        byDepartment: usersByDepartment,
        topLeads: topProjectLeads,
        totalActive: systemHealth.recentLogins,
      },
      activities: {
        total: recentActivities,
        byType: activitiesByType,
        trends: activityTrends,
      },
      gateReviews: {
        total: gateReviewStats,
        byDecision: reviewsByDecision,
        pending: systemHealth.pendingReviews,
      },
      budget: {
        projects: {
          total: budgetAnalytics.projects._sum.budget || 0,
          average: budgetAnalytics.projects._avg.budget || 0,
          utilization: avgBudgetUtilization,
          byCluster: budgetByCluster,
        },
        allocations: {
          total: budgetAnalytics.allocations.total,
          spent: budgetAnalytics.allocations.spent,
          remaining: budgetAnalytics.allocations.remaining,
          count: budgetAnalytics.allocations.count,
          byStatus: budgetAnalytics.allocations.byStatus,
          byCategory: budgetAnalytics.allocations.byCategory,
          utilizationRate:
            budgetAnalytics.allocations.total > 0
              ? Math.round(
                  (budgetAnalytics.allocations.spent /
                    budgetAnalytics.allocations.total) *
                    100
                )
              : 0,
        },
        expenses: {
          total: budgetAnalytics.expenses.total,
          count: budgetAnalytics.expenses.count,
          byStatus: budgetAnalytics.expenses.byStatus,
        },
      },
      systemHealth,
      timeRange: parseInt(timeRange),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
