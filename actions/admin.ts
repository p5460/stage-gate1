"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getDashboardStats() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
    return { error: "Unauthorized" };
  }

  try {
    const [
      totalUsers,
      totalProjects,
      activeProjects,
      pendingReviews,
      openRedFlags,
      totalClusters,
      recentActivity,
    ] = await Promise.all([
      db.user.count(),
      db.project.count(),
      db.project.count({ where: { status: "ACTIVE" } }),
      db.gateReview.count({ where: { isCompleted: false } }),
      db.redFlag.count({ where: { status: "OPEN" } }),
      db.cluster.count(),
      db.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          project: true,
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalUsers,
        totalProjects,
        activeProjects,
        pendingReviews,
        openRedFlags,
        totalClusters,
        recentActivity,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { error: "Failed to fetch dashboard statistics" };
  }
}

export async function getSystemHealth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    // Check database connectivity and performance
    const startTime = Date.now();
    await db.user.count();
    const dbResponseTime = Date.now() - startTime;

    // Get storage usage (simplified)
    const [documentCount, totalFileSize] = await Promise.all([
      db.document.count(),
      db.document.aggregate({
        _sum: {
          fileSize: true,
        },
      }),
    ]);

    return {
      success: true,
      health: {
        database: {
          status: dbResponseTime < 1000 ? "healthy" : "slow",
          responseTime: dbResponseTime,
        },
        storage: {
          documentCount,
          totalSize: totalFileSize._sum.fileSize || 0,
        },
        uptime: process.uptime(),
      },
    };
  } catch (error) {
    console.error("Error checking system health:", error);
    return { error: "Failed to check system health" };
  }
}

export async function bulkUpdateUserRoles(userIds: string[], newRole: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await db.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        role: newRole as any,
      },
    });

    // Create activity logs
    for (const userId of userIds) {
      await db.activityLog.create({
        data: {
          userId: session.user.id!,
          action: "BULK_ROLE_UPDATE",
          details: `User role updated to ${newRole}`,
        },
      });
    }

    revalidatePath("/admin/users");
    return { success: true, updatedCount: userIds.length };
  } catch (error) {
    console.error("Error bulk updating user roles:", error);
    return { error: "Failed to update user roles" };
  }
}

export async function exportSystemData(format: "json" | "csv") {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const [users, projects, clusters, activities] = await Promise.all([
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          createdAt: true,
        },
      }),
      db.project.findMany({
        include: {
          lead: true,
          cluster: true,
          _count: {
            select: {
              documents: true,
              redFlags: true,
              members: true,
            },
          },
        },
      }),
      db.cluster.findMany({
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
      }),
      db.activityLog.findMany({
        take: 1000,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          project: true,
        },
      }),
    ]);

    const data = {
      users,
      projects,
      clusters,
      activities,
      exportedAt: new Date().toISOString(),
      exportedBy: user.name,
    };

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify(data, null, 2),
        filename: `system-export-${new Date().toISOString().split("T")[0]}.json`,
        mimeType: "application/json",
      };
    } else {
      // Convert to CSV format (simplified)
      const csvData = [
        "Type,ID,Name,Email,Role,Department,Created",
        ...users.map(
          (u: any) =>
            `User,${u.id},${u.name},${u.email},${u.role},${u.department},${u.createdAt}`
        ),
        ...projects.map(
          (p: any) =>
            `Project,${p.id},${p.name},,${p.status},${p.cluster.name},${p.createdAt}`
        ),
      ].join("\n");

      return {
        success: true,
        data: csvData,
        filename: `system-export-${new Date().toISOString().split("T")[0]}.csv`,
        mimeType: "text/csv",
      };
    }
  } catch (error) {
    console.error("Error exporting system data:", error);
    return { error: "Failed to export system data" };
  }
}

export async function cleanupOldData(daysOld: number = 90) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Clean up old activity logs
    const deletedActivities = await db.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Clean up old notifications
    const deletedNotifications = await db.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    // Create activity log for cleanup
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "DATA_CLEANUP",
        details: `Cleaned up ${deletedActivities.count} activities and ${deletedNotifications.count} notifications older than ${daysOld} days`,
      },
    });

    return {
      success: true,
      cleaned: {
        activities: deletedActivities.count,
        notifications: deletedNotifications.count,
      },
    };
  } catch (error) {
    console.error("Error cleaning up old data:", error);
    return { error: "Failed to cleanup old data" };
  }
}
