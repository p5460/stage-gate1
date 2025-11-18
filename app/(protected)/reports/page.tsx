import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportReports } from "@/components/reports/export-reports";
import {
  BarChart3,
  FileText,
  Download,
  TrendingUp,
  Calendar,
  Users,
  FolderOpen,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Get comprehensive analytics data
  const [
    totalProjects,
    projectsByStage,
    projectsByStatus,
    gateReviewStats,
    recentActivities,
    budgetAnalytics,
    userStats,
  ] = await Promise.all([
    db.project.count(),
    db.project.groupBy({
      by: ["currentStage"],
      _count: true,
    }),
    db.project.groupBy({
      by: ["status"],
      _count: true,
    }),
    db.gateReview.groupBy({
      by: ["decision"],
      _count: true,
      where: {
        decision: { not: null },
      },
    }),
    db.activityLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
    db.project.aggregate({
      _sum: {
        budget: true,
      },
      _avg: {
        budget: true,
        budgetUtilization: true,
      },
    }),
    db.user.groupBy({
      by: ["role"],
      _count: true,
    }),
  ]);

  const reportCategories = [
    {
      title: "Project Overview",
      description: "Comprehensive project status and progress reports",
      icon: FolderOpen,
      color: "bg-blue-500",
      reports: [
        "Active Projects Summary",
        "Project Status Distribution",
        "Stage Progression Analysis",
        "Budget Utilization Report",
      ],
    },
    {
      title: "Gate Review Analytics",
      description: "Gate review performance and decision analysis",
      icon: BarChart3,
      color: "bg-green-500",
      reports: [
        "Gate Decision Distribution",
        "Review Completion Rates",
        "Reviewer Performance",
        "Stage Success Rates",
      ],
    },
    {
      title: "Financial Reports",
      description: "Budget allocation and utilization analysis",
      icon: TrendingUp,
      color: "bg-purple-500",
      reports: [
        "Budget vs Actual Spending",
        "Cost per Project Stage",
        "Cluster Budget Analysis",
        "ROI Projections",
      ],
    },
    {
      title: "User & Team Reports",
      description: "User activity and team performance metrics",
      icon: Users,
      color: "bg-orange-500",
      reports: [
        "User Activity Summary",
        "Project Lead Performance",
        "Team Productivity Metrics",
        "Role Distribution Analysis",
      ],
    },
  ];

  const quickStats = [
    {
      title: "Total Projects",
      value: totalProjects,
      icon: FolderOpen,
      color: "text-blue-600",
    },
    {
      title: "Active Projects",
      value:
        projectsByStatus.find((p: any) => p.status === "ACTIVE")?._count || 0,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Completed Reviews",
      value: gateReviewStats.reduce(
        (sum: number, stat: any) => sum + stat._count,
        0
      ),
      icon: BarChart3,
      color: "text-purple-600",
    },
    {
      title: "Recent Activities",
      value: recentActivities,
      icon: Calendar,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Generate comprehensive reports and analyze project performance
          </p>
        </div>
        <ExportReports />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="reviews">Gate Reviews</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${category.color} text-white`}
                    >
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {category.title}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.reports.map((report, reportIndex) => (
                      <div
                        key={reportIndex}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <span className="text-sm">{report}</span>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects by Stage</CardTitle>
                <CardDescription>
                  Distribution of projects across different stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectsByStage.map((stage: any) => (
                    <div
                      key={stage.currentStage}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {stage.currentStage.replace("STAGE_", "Stage ")}
                        </Badge>
                      </div>
                      <span className="font-semibold">{stage._count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects by Status</CardTitle>
                <CardDescription>
                  Current status distribution of all projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectsByStatus.map((status: any) => (
                    <div
                      key={status.status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {status.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <span className="font-semibold">{status._count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gate Review Decisions</CardTitle>
                <CardDescription>
                  Distribution of gate review outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gateReviewStats.map((decision: any) => (
                    <div
                      key={decision.decision}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={
                            decision.decision === "GO"
                              ? "bg-green-100 text-green-800"
                              : decision.decision === "RECYCLE"
                                ? "bg-yellow-100 text-yellow-800"
                                : decision.decision === "HOLD"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                          }
                        >
                          {decision.decision}
                        </Badge>
                      </div>
                      <span className="font-semibold">{decision._count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Performance</CardTitle>
                <CardDescription>
                  Gate review completion and success metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold">
                      {gateReviewStats.length > 0
                        ? Math.round(
                            ((gateReviewStats.find(
                              (s: any) => s.decision === "GO"
                            )?._count || 0) /
                              gateReviewStats.reduce(
                                (sum: number, s: any) => sum + s._count,
                                0
                              )) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <span className="font-semibold">
                      {gateReviewStats.reduce(
                        (sum: number, s: any) => sum + s._count,
                        0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>
                  Total budget allocation and utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="font-semibold">
                      R{(budgetAnalytics._sum.budget || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Average Budget
                    </span>
                    <span className="font-semibold">
                      R
                      {Math.round(
                        budgetAnalytics._avg.budget || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Average Utilization
                    </span>
                    <span className="font-semibold">
                      {Math.round(budgetAnalytics._avg.budgetUtilization || 0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>
                  Users by role across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userStats.map((user: any) => (
                    <div
                      key={user.role}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {user.role.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <span className="font-semibold">{user._count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
