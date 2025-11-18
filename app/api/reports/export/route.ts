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
    const reportType = searchParams.get("type") || "comprehensive";
    const format = searchParams.get("format") || "json";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permissions
    const hasPermission = user.role === "ADMIN" || user.role === "GATEKEEPER";
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let reportData: any = {};
    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {};

    switch (reportType) {
      case "comprehensive":
        reportData = await generateComprehensiveReport(dateFilter);
        break;
      case "projects":
        reportData = await generateProjectsReport(dateFilter);
        break;
      case "reviews":
        reportData = await generateReviewsReport(dateFilter);
        break;
      case "financial":
        reportData = await generateFinancialReport(dateFilter);
        break;
      case "users":
        reportData = await generateUsersReport(dateFilter);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Add metadata
    const exportData = {
      ...reportData,
      metadata: {
        reportType,
        generatedAt: new Date().toISOString(),
        generatedBy: {
          name: user.name,
          email: user.email,
        },
        dateRange: startDate && endDate ? { startDate, endDate } : null,
      },
    };

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "REPORT_EXPORTED",
        details: `${reportType} report exported in ${format.toUpperCase()} format`,
      },
    });

    const filename = `${reportType}-report-${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      const csvData = generateCSV(reportData, reportType);
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
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateComprehensiveReport(dateFilter: any) {
  try {
    // Get basic project data
    const totalProjects = await db.project.count({ where: dateFilter });

    const projectsByStage = await db.project.groupBy({
      by: ["currentStage"],
      _count: true,
      where: dateFilter,
    });

    const projectsByStatus = await db.project.groupBy({
      by: ["status"],
      _count: true,
      where: dateFilter,
    });

    // Try to get gate reviews, but handle if table doesn't exist
    let gateReviewStats: any[] = [];
    try {
      const result = await db.gateReview.groupBy({
        by: ["decision"],
        _count: true,
        where: {
          ...dateFilter,
          decision: { not: null },
        },
      });
      gateReviewStats = result as any[];
    } catch (error) {
      console.warn("Gate reviews not available:", error);
    }

    // Try to get budget analytics
    let budgetAnalytics: any = {
      _sum: { budget: 0 },
      _avg: { budget: 0, budgetUtilization: 0 },
    };
    try {
      budgetAnalytics = await db.project.aggregate({
        _sum: { budget: true },
        _avg: { budget: true, budgetUtilization: true },
        where: dateFilter,
      });
    } catch (error) {
      console.warn("Budget analytics not available:", error);
    }

    const userStats = await db.user.groupBy({
      by: ["role"],
      _count: true,
    });

    // Try to get activity logs
    let recentActivities = 0;
    try {
      recentActivities = await db.activityLog.count({
        where: {
          ...dateFilter,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });
    } catch (error) {
      console.warn("Activity logs not available:", error);
    }

    // Try to get red flag stats
    let redFlagStats: any[] = [];
    try {
      const groupedRedFlags = await db.redFlag.groupBy({
        by: ["severity", "status"],
        _count: true,
        where: dateFilter,
      });
      redFlagStats = groupedRedFlags as any[];
    } catch (error) {
      console.warn("Red flags not available:", error);
    }

    return {
      summary: {
        totalProjects,
        recentActivities,
        totalBudget: budgetAnalytics._sum.budget || 0,
        averageBudget: budgetAnalytics._avg.budget || 0,
        averageBudgetUtilization: budgetAnalytics._avg.budgetUtilization || 0,
      },
      projects: {
        byStage: projectsByStage,
        byStatus: projectsByStatus,
      },
      gateReviews: gateReviewStats,
      users: userStats,
      redFlags: redFlagStats,
    };
  } catch (error) {
    console.error("Error generating comprehensive report:", error);
    return {
      summary: {
        totalProjects: 0,
        recentActivities: 0,
        totalBudget: 0,
        averageBudget: 0,
        averageBudgetUtilization: 0,
      },
      projects: { byStage: [], byStatus: [] },
      gateReviews: [],
      users: [],
      redFlags: [],
    };
  }
}

async function generateProjectsReport(dateFilter: any) {
  try {
    const projects = await db.project.findMany({
      where: dateFilter,
      include: {
        lead: { select: { name: true, email: true } },
        cluster: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { projects };
  } catch (error) {
    console.error("Error generating projects report:", error);
    // Return basic project data if detailed query fails
    const projects = await db.project.findMany({
      where: dateFilter,
      select: {
        id: true,
        projectId: true,
        name: true,
        status: true,
        currentStage: true,
        budget: true,
        budgetUtilization: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { projects };
  }
}

async function generateReviewsReport(dateFilter: any) {
  try {
    const reviews = await db.gateReview.findMany({
      where: dateFilter,
      include: {
        project: { select: { name: true, projectId: true } },
        reviewer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { reviews };
  } catch (error) {
    console.warn("Gate reviews table not available:", error);
    return { reviews: [] };
  }
}

async function generateFinancialReport(dateFilter: any) {
  try {
    const budgetByStage = await db.project.groupBy({
      by: ["currentStage"],
      _sum: { budget: true },
      _avg: { budgetUtilization: true },
      where: dateFilter,
    });

    const totalBudgets = await db.project.aggregate({
      _sum: { budget: true },
      _avg: { budget: true, budgetUtilization: true },
      where: dateFilter,
    });

    // Try to get budget by cluster
    let budgetByCluster: any[] = [];
    try {
      const groupedBudget = await db.project.groupBy({
        by: ["clusterId"],
        _sum: { budget: true },
        _avg: { budgetUtilization: true },
        where: dateFilter,
      });
      budgetByCluster = groupedBudget as any[];
    } catch (error) {
      console.warn("Cluster budget data not available:", error);
    }

    return {
      summary: totalBudgets,
      byCluster: budgetByCluster,
      byStage: budgetByStage,
    };
  } catch (error) {
    console.error("Error generating financial report:", error);
    return {
      summary: {
        _sum: { budget: 0 },
        _avg: { budget: 0, budgetUtilization: 0 },
      },
      byCluster: [],
      byStage: [],
    };
  }
}

async function generateUsersReport(dateFilter: any) {
  try {
    const users = await db.user.findMany({
      where: dateFilter,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { users };
  } catch (error) {
    console.error("Error generating users report:", error);
    return { users: [] };
  }
}

function generateCSV(data: any, reportType: string): string {
  switch (reportType) {
    case "projects":
      return [
        "ID,Name,Status,Stage,Budget,Utilization,Lead,Cluster,Created",
        ...data.projects.map(
          (project: any) =>
            `${project.projectId || project.id},"${project.name}",${project.status},${project.currentStage},${project.budget || 0},${project.budgetUtilization || 0}%,"${project.lead?.name || "N/A"}","${project.cluster?.name || "N/A"}",${project.createdAt ? new Date(project.createdAt).toISOString().split("T")[0] : "N/A"}`
        ),
      ].join("\n");

    case "reviews":
      return [
        "Project,Stage,Decision,Score,Reviewer,Date,Comments",
        ...data.reviews.map(
          (review: any) =>
            `"${review.project?.name || "N/A"}",${review.stage},${review.decision || "Pending"},${review.score || ""},"${review.reviewer?.name || "N/A"}",${review.reviewDate ? new Date(review.reviewDate).toISOString().split("T")[0] : ""},"${review.comments || ""}"`
        ),
      ].join("\n");

    case "users":
      return [
        "Name,Email,Role,Department,Position,Created",
        ...data.users.map(
          (user: any) =>
            `"${user.name}",${user.email},${user.role},"${user.department || ""}","${user.position || ""}",${user.createdAt ? new Date(user.createdAt).toISOString().split("T")[0] : "N/A"}`
        ),
      ].join("\n");

    default:
      return "Report type not supported for CSV export";
  }
}
