"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  FolderOpen,
  Activity,
  DollarSign,
  CheckCircle,
  RefreshCw,
  Download,
  FileText,
  Presentation,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AnalyticsData {
  overview: {
    totalProjects: number;
    totalUsers: number;
    totalClusters: number;
    recentActivities: number;
    completionRate: number;
    avgProjectDuration: number;
    totalBudget: number;
    avgBudgetUtilization: number;
  };
  projects: {
    byStage: Array<{ currentStage: string; _count: number }>;
    byStatus: Array<{ status: string; _count: number }>;
    byCluster: Array<{
      clusterId: string;
      clusterName: string;
      _count: number;
    }>;
    trends: Array<{ date: string; count: number }>;
  };
  users: {
    byRole: Array<{ role: string; _count: number }>;
    byDepartment: Array<{ department: string; _count: number }>;
    topLeads: Array<{
      id: string;
      name: string;
      email: string;
      _count: { ledProjects: number };
    }>;
    totalActive: number;
  };
  activities: {
    total: number;
    byType: Array<{ action: string; _count: number }>;
    trends: Array<{ date: string; count: number }>;
  };
  gateReviews: {
    total: number;
    byDecision: Array<{ decision: string; _count: number }>;
    pending: number;
  };
  budget: {
    total: number;
    average: number;
    utilization: number;
    byCluster: Array<{
      clusterId: string;
      clusterName: string;
      _sum: { budget: number };
      _avg: { budgetUtilization: number };
    }>;
  };
  systemHealth: {
    activeProjects: number;
    pendingReviews: number;
    redFlags: number;
    recentLogins: number;
  };
  timeRange: number;
  generatedAt: string;
}

export function AdminAnalyticsClient() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/analytics?timeRange=${timeRange}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        toast.error("Failed to load analytics");
      }
    } catch (error) {
      toast.error("Error loading analytics");
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "STAGE_0":
        return "bg-blue-100 text-blue-800";
      case "STAGE_1":
        return "bg-purple-100 text-purple-800";
      case "STAGE_2":
        return "bg-green-100 text-green-800";
      case "STAGE_3":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "GATEKEEPER":
        return "bg-purple-100 text-purple-800";
      case "PROJECT_LEAD":
        return "bg-blue-100 text-blue-800";
      case "RESEARCHER":
        return "bg-green-100 text-green-800";
      case "REVIEWER":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportAnalytics = async (exportFormat: "pdf" | "pptx" | "csv") => {
    if (!analytics) return;

    setExporting(true);
    try {
      const response = await fetch("/api/admin/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: exportFormat,
          analytics,
          timeRange: parseInt(timeRange),
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `analytics-report-${exportFormat}-${format(
          new Date(),
          "yyyy-MM-dd"
        )}.${exportFormat === "pdf" ? "pdf" : exportFormat === "csv" ? "csv" : "json"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(
          `Analytics report exported as ${exportFormat.toUpperCase()}`
        );
      } else {
        toast.error("Failed to export analytics report");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting analytics report");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            onClick={() => exportAnalytics("pdf")}
            disabled={exporting || !analytics}
            variant="outline"
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={() => exportAnalytics("pptx")}
            disabled={exporting || !analytics}
            variant="outline"
            size="sm"
          >
            <Presentation className="h-4 w-4 mr-2" />
            Export PowerPoint
          </Button>
          <Button
            onClick={() => exportAnalytics("csv")}
            disabled={exporting || !analytics}
            variant="outline"
            size="sm"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Projects
                </p>
                <p className="text-2xl font-bold">
                  {analytics.overview.totalProjects}
                </p>
                <p className="text-xs text-gray-500">
                  {analytics.overview.completionRate}% completion rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">
                  {analytics.overview.totalUsers}
                </p>
                <p className="text-xs text-gray-500">
                  {analytics.users.totalActive} active recently
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Budget
                </p>
                <br />
                <p className="text-2xl font-bold">
                  {formatCurrency(analytics.overview.totalBudget)}
                </p>
                <br />
                <p className="text-xs text-gray-500">
                  {analytics.overview.avgBudgetUtilization}% avg utilization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Recent Activities
                </p>
                <p className="text-2xl font-bold">
                  {analytics.overview.recentActivities}
                </p>
                <p className="text-xs text-gray-500">
                  Last {analytics.timeRange} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.systemHealth.activeProjects}
              </div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.systemHealth.pendingReviews}
              </div>
              <div className="text-sm text-gray-600">Pending Reviews</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {analytics.systemHealth.redFlags}
              </div>
              <div className="text-sm text-gray-600">Open Red Flags</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.systemHealth.recentLogins}
              </div>
              <div className="text-sm text-gray-600">Recent Logins</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reviews">Gate Reviews</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.projects.byStage.map((stage) => (
                    <div
                      key={stage.currentStage}
                      className="flex items-center justify-between"
                    >
                      <Badge className={getStageColor(stage.currentStage)}>
                        {stage.currentStage.replace("STAGE_", "Stage ")}
                      </Badge>
                      <span className="font-semibold">{stage._count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.projects.byStatus.map((status) => (
                    <div
                      key={status.status}
                      className="flex items-center justify-between"
                    >
                      <Badge className={getStatusColor(status.status)}>
                        {status.status.replace(/_/g, " ")}
                      </Badge>
                      <span className="font-semibold">{status._count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.users.byRole.map((role) => (
                    <div
                      key={role.role}
                      className="flex items-center justify-between"
                    >
                      <Badge className={getRoleColor(role.role)}>
                        {role.role.replace(/_/g, " ")}
                      </Badge>
                      <span className="font-semibold">{role._count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Project Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.users.topLeads.map((lead, index) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-gray-500">
                          {lead.email}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {lead._count.ledProjects} projects
                      </Badge>
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
                <CardTitle>Review Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.gateReviews.byDecision.map((decision) => (
                    <div
                      key={decision.decision}
                      className="flex items-center justify-between"
                    >
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
                      <span className="font-semibold">{decision._count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Reviews</span>
                    <span className="font-semibold">
                      {analytics.gateReviews.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Reviews</span>
                    <span className="font-semibold text-yellow-600">
                      {analytics.gateReviews.pending}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-semibold text-green-600">
                      {analytics.gateReviews.total > 0
                        ? Math.round(
                            ((analytics.gateReviews.byDecision.find(
                              (d) => d.decision === "GO"
                            )?._count || 0) /
                              analytics.gateReviews.total) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Budget</span>
                    <span className="font-semibold">
                      {formatCurrency(analytics.budget.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Budget</span>
                    <span className="font-semibold">
                      {formatCurrency(analytics.budget.average)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Utilization</span>
                    <span className="font-semibold">
                      {analytics.budget.utilization}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget by Cluster</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.budget.byCluster
                    .slice(0, 5)
                    .map((cluster, index) => (
                      <div
                        key={cluster.clusterId}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{cluster.clusterName}</span>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(cluster._sum.budget || 0)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(cluster._avg.budgetUtilization || 0)}%
                            utilized
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.activities.byType.slice(0, 8).map((activity) => (
                    <div
                      key={activity.action}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">
                        {activity.action.replace(/_/g, " ")}
                      </span>
                      <Badge variant="outline">{activity._count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Activities</span>
                    <span className="font-semibold">
                      {analytics.activities.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Average</span>
                    <span className="font-semibold">
                      {Math.round(
                        analytics.activities.total / analytics.timeRange
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Most Active</span>
                    <span className="font-semibold">
                      {analytics.activities.byType[0]?.action.replace(
                        /_/g,
                        " "
                      ) || "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(analytics.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
