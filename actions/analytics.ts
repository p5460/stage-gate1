"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function getAdminAnalytics(timeRange: number = 30) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has admin permissions
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
    return { error: "Unauthorized to view analytics" };
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Get basic analytics data with error handling
    const analytics = {
      overview: {
        totalProjects: await db.project.count().catch(() => 0),
        totalUsers: await db.user.count().catch(() => 0),
        totalClusters: await db.cluster.count().catch(() => 0),
        recentActivities: await db.activityLog
          .count({
            where: { createdAt: { gte: startDate } },
          })
          .catch(() => 0),
      },
      projects: {
        byStage: await db.project
          .groupBy({
            by: ["currentStage"],
            _count: true,
          })
          .catch(() => []),
        byStatus: await db.project
          .groupBy({
            by: ["status"],
            _count: true,
          })
          .catch(() => []),
      },
      users: {
        byRole: await db.user
          .groupBy({
            by: ["role"],
            _count: true,
          })
          .catch(() => []),
      },
      systemHealth: {
        activeProjects: await db.project
          .count({
            where: { status: "ACTIVE" },
          })
          .catch(() => 0),
        pendingReviews: await db.gateReview
          .count({
            where: { isCompleted: false },
          })
          .catch(() => 0),
        openRedFlags: await db.redFlag
          .count({
            where: { status: "OPEN" },
          })
          .catch(() => 0),
      },
    };

    return { success: true, analytics };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { error: "Failed to fetch analytics data" };
  }
}

export async function getSystemHealth() {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const health = {
      activeProjects: await db.project
        .count({
          where: { status: "ACTIVE" },
        })
        .catch(() => 0),
      totalUsers: await db.user.count().catch(() => 0),
      pendingReviews: await db.gateReview
        .count({
          where: { isCompleted: false },
        })
        .catch(() => 0),
      openRedFlags: await db.redFlag
        .count({
          where: { status: "OPEN" },
        })
        .catch(() => 0),
      recentActivities: await db.activityLog
        .count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        })
        .catch(() => 0),
    };

    return { success: true, health };
  } catch (error) {
    console.error("Error fetching system health:", error);
    return { error: "Failed to fetch system health" };
  }
}
export async function exportAnalyticsData(
  timeRange: number = 30,
  format: "json" | "csv" | "xlsx" = "json"
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  // Check if user has admin permissions
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
    return { error: "Unauthorized to export analytics" };
  }

  try {
    const response = await fetch(
      `/api/admin/analytics/export?timeRange=${timeRange}&format=${format}`
    );

    if (!response.ok) {
      return { error: "Failed to export analytics data" };
    }

    if (format === "csv") {
      const csvData = await response.text();
      return { success: true, data: csvData, format: "csv" };
    }

    const data = await response.json();
    return { success: true, data: data.data, format };
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return { error: "Failed to export analytics data" };
  }
}
