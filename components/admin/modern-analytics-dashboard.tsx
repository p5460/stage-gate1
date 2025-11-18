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
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Users,
  FolderOpen,
  TrendingUp,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  Target,
  Award,
  Calendar,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Building2,
  FileText,
  Star,
  Eye,
  Download,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";

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
    projects: {
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
    allocations: {
      total: number;
      spent: number;
      remaining: number;
      count: number;
      utilizationRate: number;
      byStatus: Array<{
        status: string;
        _count: number;
        _sum: { allocatedAmount: number };
      }>;
      byCategory: Array<{
        category: string;
        _count: number;
        _sum: { allocatedAmount: number; spentAmount: number };
      }>;
    };
    expenses: {
      total: number;
      count: number;
      byStatus: Array<{
        status: string;
        _count: number;
        _sum: { amount: number };
      }>;
    };
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
export function ModernAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");
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
        toast.success("Analytics updated successfully");
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getStageColor = (stage: string) => {
    const colors = {
      STAGE_0: "bg-gradient-to-r from-blue-500 to-blue-600",
      STAGE_1: "bg-gradient-to-r from-purple-500 to-purple-600",
      STAGE_2: "bg-gradient-to-r from-green-500 to-green-600",
      STAGE_3: "bg-gradient-to-r from-yellow-500 to-yellow-600",
    };
    return (
      colors[stage as keyof typeof colors] ||
      "bg-gradient-to-r from-gray-500 to-gray-600"
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "text-green-600 bg-green-50 border-green-200",
      COMPLETED: "text-blue-600 bg-blue-50 border-blue-200",
      ON_HOLD: "text-yellow-600 bg-yellow-50 border-yellow-200",
      CANCELLED: "text-red-600 bg-red-50 border-red-200",
    };
    return (
      colors[status as keyof typeof colors] ||
      "text-gray-600 bg-gray-50 border-gray-200"
    );
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (current < previous)
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const handleExport = async (
    format: "json" | "csv" | "pdf" | "pptx" = "csv"
  ) => {
    if (!analytics) return;

    setExporting(true);
    try {
      toast.info(`Preparing ${format.toUpperCase()} export...`);

      const response = await fetch("/api/admin/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
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

        const fileName = `analytics-report-${new Date().toISOString().split("T")[0]}`;
        let fileExtension: string = format;

        // Get the actual file extension from the response headers
        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            const fullFilename = filenameMatch[1];
            const extensionMatch = fullFilename.match(/\.([^.]+)$/);
            if (extensionMatch) {
              fileExtension = extensionMatch[1];
            }
          }
        }

        // Fallback to format-based extensions
        if (fileExtension === format) {
          if (format === "pdf") {
            fileExtension = "pdf"; // Now returns proper PDF or HTML fallback
          } else if (format === "pptx") {
            fileExtension = "json"; // PowerPoint data as JSON
          } else if (format === "csv") {
            fileExtension = "csv";
          } else {
            fileExtension = "json";
          }
        }

        a.download = `${fileName}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success(
          `Analytics report exported successfully as ${format.toUpperCase()}`
        );
      } else {
        // Get error details from response
        let errorMessage = "Failed to export analytics data";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            console.error("Export error details:", errorData.details);
          }
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }

        console.error(
          "Export failed with status:",
          response.status,
          response.statusText
        );
        toast.error(`Export failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting analytics data");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">
              Loading Analytics Dashboard
            </h3>
            <p className="text-gray-600">
              Analyzing your data and generating insights...
            </p>
            <div className="flex items-center justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Unable to Load Analytics
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an issue while fetching your analytics data. Please
              try again.
            </p>
            <Button
              onClick={fetchAnalytics}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>
                  Last updated:{" "}
                  {new Date(analytics.generatedAt).toLocaleString()}
                </span>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 ml-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Live
                </Badge>
              </div>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-36 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={fetchAnalytics}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50 border-gray-200 transition-all duration-200"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              <div className="flex items-center space-x-1">
                <Button
                  onClick={() => handleExport("pdf")}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 border-gray-200"
                  disabled={loading || exporting}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  onClick={() => handleExport("pptx")}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 border-gray-200"
                  disabled={loading || exporting}
                >
                  <Presentation className="h-4 w-4 mr-2" />
                  Export PowerPoint
                </Button>
                <Button
                  onClick={() => handleExport("csv")}
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 border-gray-200"
                  disabled={loading || exporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <FolderOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      Total Projects
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(analytics.overview.totalProjects)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">
                          {analytics.overview.completionRate}% completed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">
                    vs last period
                  </div>
                  {getTrendIcon(
                    analytics.overview.totalProjects,
                    analytics.overview.totalProjects * 0.9
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <Users className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      Active Users
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(analytics.overview.totalUsers)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">
                          {analytics.users.totalActive} recently active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">
                    vs last period
                  </div>
                  {getTrendIcon(
                    analytics.users.totalActive,
                    analytics.users.totalActive * 0.85
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      Total Budget
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.overview.totalBudget)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">
                          {analytics.overview.avgBudgetUtilization}% utilized
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">utilization</div>
                  <Progress
                    value={analytics.overview.avgBudgetUtilization}
                    className="w-12 h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Activity className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      Recent Activity
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(analytics.overview.recentActivities)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">
                          Last {analytics.timeRange} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">trend</div>
                  {getTrendIcon(
                    analytics.overview.recentActivities,
                    analytics.overview.recentActivities * 0.8
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* System Health Status */}
        <Card className="mb-8 bg-white border-0 shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    System Health Monitor
                  </CardTitle>
                  <CardDescription>
                    Real-time system status and key indicators
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                All Systems Operational
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    Healthy
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 mb-1">
                    {formatNumber(analytics.systemHealth.activeProjects)}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Active Projects
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    Running smoothly
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border border-yellow-100 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                    {analytics.systemHealth.pendingReviews > 10
                      ? "High"
                      : "Normal"}
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700 mb-1">
                    {formatNumber(analytics.systemHealth.pendingReviews)}
                  </p>
                  <p className="text-sm text-yellow-600 font-medium">
                    Pending Reviews
                  </p>
                  <p className="text-xs text-yellow-500 mt-1">
                    Awaiting approval
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-5 rounded-xl border border-red-100 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <Badge
                    className={`text-xs ${analytics.systemHealth.redFlags > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {analytics.systemHealth.redFlags > 0
                      ? "Attention"
                      : "Clear"}
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700 mb-1">
                    {formatNumber(analytics.systemHealth.redFlags)}
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    Open Red Flags
                  </p>
                  <p className="text-xs text-red-500 mt-1">Require attention</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    Active
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 mb-1">
                    {formatNumber(analytics.systemHealth.recentLogins)}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    Recent Logins
                  </p>
                  <p className="text-xs text-blue-500 mt-1">Last 7 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common administrative tasks and shortcuts
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-white hover:bg-gray-50 border-gray-200"
                onClick={() => window.open("/admin/users", "_blank")}
              >
                <Users className="h-6 w-6 text-indigo-600" />
                <div className="text-center">
                  <p className="font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-500">
                    Add, edit, or remove users
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-white hover:bg-gray-50 border-gray-200"
                onClick={() => window.open("/admin/clusters", "_blank")}
              >
                <Building2 className="h-6 w-6 text-purple-600" />
                <div className="text-center">
                  <p className="font-medium text-gray-900">Manage Clusters</p>
                  <p className="text-xs text-gray-500">
                    Configure organizational units
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-white hover:bg-gray-50 border-gray-200"
                onClick={() => handleExport("pdf")}
                disabled={exporting}
              >
                <FileText className="h-6 w-6 text-red-600" />
                <div className="text-center">
                  <p className="font-medium text-gray-900">Export PDF</p>
                  <p className="text-xs text-gray-500">Download PDF report</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-white hover:bg-gray-50 border-gray-200"
                onClick={() => handleExport("pptx")}
                disabled={exporting}
              >
                <Presentation className="h-6 w-6 text-orange-600" />
                <div className="text-center">
                  <p className="font-medium text-gray-900">Export PowerPoint</p>
                  <p className="text-xs text-gray-500">Download presentation</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 bg-white hover:bg-gray-50 border-gray-200"
                onClick={fetchAnalytics}
              >
                <RefreshCw className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <p className="font-medium text-gray-900">Refresh Data</p>
                  <p className="text-xs text-gray-500">Update all metrics</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modern Analytics Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            <TabsList className="grid w-full grid-cols-5 bg-gray-50 p-1 rounded-lg">
              <TabsTrigger
                value="overview"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Reviews
              </TabsTrigger>
              <TabsTrigger
                value="budget"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Budget
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators and success rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Project Completion Rate
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {analytics.overview.completionRate}%
                        </span>
                      </div>
                      <Progress
                        value={analytics.overview.completionRate}
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500">
                        Projects successfully completed on time
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Average Duration
                          </p>
                          <p className="text-xs text-blue-600">
                            Per project lifecycle
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-700">
                          {analytics.overview.avgProjectDuration}
                        </p>
                        <p className="text-xs text-blue-600">months</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Budget Utilization
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {analytics.overview.avgBudgetUtilization}%
                        </span>
                      </div>
                      <Progress
                        value={analytics.overview.avgBudgetUtilization}
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500">
                        Average budget utilization across projects
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span>Top Project Leaders</span>
                  </CardTitle>
                  <CardDescription>
                    Most active project leaders by project count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.users.topLeads.slice(0, 5).map((lead, index) => (
                      <div
                        key={lead.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                              : index === 1
                                ? "bg-gradient-to-r from-gray-400 to-gray-500"
                                : index === 2
                                  ? "bg-gradient-to-r from-orange-400 to-orange-500"
                                  : "bg-gradient-to-r from-blue-400 to-blue-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {lead.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {lead.email}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700"
                          >
                            {lead._count.ledProjects}
                          </Badge>
                          <Star className="h-4 w-4 text-yellow-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-700">
                        {analytics.overview.totalClusters}
                      </p>
                      <p className="text-sm text-indigo-600">Active Clusters</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-700">
                        {Math.round(
                          (analytics.overview.completionRate / 100) *
                            analytics.overview.totalProjects
                        )}
                      </p>
                      <p className="text-sm text-green-600">
                        Completed Projects
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <LineChart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-700">
                        {analytics.activities.total}
                      </p>
                      <p className="text-sm text-purple-600">
                        Total Activities
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    <span>Projects by Stage</span>
                  </CardTitle>
                  <CardDescription>
                    Distribution across stage-gate phases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.projects.byStage.map((stage, index) => (
                      <div
                        key={stage.currentStage}
                        className="flex items-center space-x-3"
                      >
                        <div
                          className={`w-4 h-4 rounded-full ${getStageColor(stage.currentStage)}`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {stage.currentStage.replace("STAGE_", "Stage ")}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {stage._count}
                            </span>
                          </div>
                          <Progress
                            value={
                              (stage._count /
                                analytics.overview.totalProjects) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Project Status</span>
                  </CardTitle>
                  <CardDescription>Current status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.projects.byStatus.map((status) => (
                      <div
                        key={status.status}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(status.status)}>
                            {status.status.replace("_", " ")}
                          </Badge>
                          <span className="text-sm font-medium text-gray-700">
                            {status.status.replace("_", " ").toLowerCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {status._count}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.round(
                              (status._count /
                                analytics.overview.totalProjects) *
                                100
                            )}
                            %
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <span>Projects by Cluster</span>
                </CardTitle>
                <CardDescription>
                  Project distribution across organizational clusters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.projects.byCluster.map((cluster) => (
                    <div
                      key={cluster.clusterId}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {cluster.clusterName}
                        </h4>
                        <Badge variant="outline">
                          {cluster._count} projects
                        </Badge>
                      </div>
                      <Progress
                        value={
                          (cluster._count / analytics.overview.totalProjects) *
                          100
                        }
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(
                          (cluster._count / analytics.overview.totalProjects) *
                            100
                        )}
                        % of total
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Users by Role</span>
                  </CardTitle>
                  <CardDescription>
                    Role distribution across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.users.byRole.map((role) => (
                      <div
                        key={role.role}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {role.role.toLowerCase().replace("_", " ")}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {role._count}
                            </span>
                          </div>
                          <Progress
                            value={
                              (role._count / analytics.overview.totalUsers) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Building2 className="h-5 w-5 text-green-600" />
                    <span>Users by Department</span>
                  </CardTitle>
                  <CardDescription>
                    Department-wise user distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.users.byDepartment.length > 0 ? (
                      analytics.users.byDepartment.map((dept) => (
                        <div
                          key={dept.department}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {dept.department || "Unassigned"}
                          </span>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {dept._count}
                            </p>
                            <p className="text-xs text-gray-500">users</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No department data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>User Activity Summary</span>
                </CardTitle>
                <CardDescription>
                  User engagement and activity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {analytics.overview.totalUsers}
                    </p>
                    <p className="text-sm text-blue-600">Total Users</p>
                  </div>

                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-100">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {analytics.users.totalActive}
                    </p>
                    <p className="text-sm text-green-600">Recently Active</p>
                  </div>

                  <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                      {analytics.users.topLeads.length}
                    </p>
                    <p className="text-sm text-purple-600">Project Leaders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span>Gate Review Status</span>
                  </CardTitle>
                  <CardDescription>
                    Overview of gate review activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-2xl font-bold text-blue-700">
                          {analytics.gateReviews.total}
                        </p>
                        <p className="text-sm text-blue-600">Total Reviews</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <p className="text-2xl font-bold text-yellow-700">
                          {analytics.gateReviews.pending}
                        </p>
                        <p className="text-sm text-yellow-600">
                          Pending Reviews
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Review Decisions
                      </h4>
                      {analytics.gateReviews.byDecision.map((decision) => (
                        <div
                          key={decision.decision}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {decision.decision
                              ?.toLowerCase()
                              .replace("_", " ") || "Pending"}
                          </span>
                          <Badge variant="outline">{decision._count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>Review Performance</span>
                  </CardTitle>
                  <CardDescription>
                    Review completion and efficiency metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">
                          Completion Rate
                        </span>
                        <span className="text-sm font-bold text-green-700">
                          {analytics.gateReviews.total > 0
                            ? Math.round(
                                ((analytics.gateReviews.total -
                                  analytics.gateReviews.pending) /
                                  analytics.gateReviews.total) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          analytics.gateReviews.total > 0
                            ? ((analytics.gateReviews.total -
                                analytics.gateReviews.pending) /
                                analytics.gateReviews.total) *
                              100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            Completed
                          </span>
                        </div>
                        <span className="font-bold text-blue-700">
                          {analytics.gateReviews.total -
                            analytics.gateReviews.pending}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            In Progress
                          </span>
                        </div>
                        <span className="font-bold text-yellow-700">
                          {analytics.gateReviews.pending}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Budget Overview</span>
                  </CardTitle>
                  <CardDescription>
                    Financial metrics and budget utilization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              Total Budget
                            </p>
                            <p className="text-2xl font-bold text-green-700">
                              {formatCurrency(analytics.budget.projects.total)}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Average Budget
                            </p>
                            <p className="text-2xl font-bold text-blue-700">
                              {formatCurrency(
                                analytics.budget.projects.average
                              )}
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Target className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Overall Utilization
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {analytics.budget.projects.utilization}%
                        </span>
                      </div>
                      <Progress
                        value={analytics.budget.projects.utilization}
                        className="h-3"
                      />
                      <p className="text-xs text-gray-500">
                        Budget utilization across all projects
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <span>Budget by Cluster</span>
                  </CardTitle>
                  <CardDescription>
                    Budget allocation across organizational clusters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.budget.projects.byCluster.length > 0 ? (
                      analytics.budget.projects.byCluster.map((cluster) => (
                        <div
                          key={cluster.clusterId}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {cluster.clusterName}
                            </h4>
                            <Badge variant="outline">Active</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Total Budget
                              </span>
                              <span className="font-bold text-gray-900">
                                {formatCurrency(cluster._sum.budget || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Avg Utilization
                              </span>
                              <span className="font-bold text-purple-600">
                                {Math.round(
                                  cluster._avg.budgetUtilization || 0
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={cluster._avg.budgetUtilization || 0}
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No budget data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Budget Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Budget Allocations */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Budget Allocations</span>
                  </CardTitle>
                  <CardDescription>
                    Allocation requests and utilization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">
                          Total Allocated
                        </p>
                        <p className="text-xl font-bold text-blue-700">
                          {formatCurrency(analytics.budget.allocations.total)}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          Total Spent
                        </p>
                        <p className="text-xl font-bold text-green-700">
                          {formatCurrency(analytics.budget.allocations.spent)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Utilization Rate
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {analytics.budget.allocations.utilizationRate}%
                        </span>
                      </div>
                      <Progress
                        value={analytics.budget.allocations.utilizationRate}
                        className="h-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        By Status
                      </p>
                      {analytics.budget.allocations.byStatus.map((status) => (
                        <div
                          key={status.status}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="capitalize">
                            {status.status.toLowerCase()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span>{status._count}</span>
                            <span className="text-gray-500">
                              ({formatCurrency(status._sum.allocatedAmount)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget Expenses */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <span>Expenses</span>
                  </CardTitle>
                  <CardDescription>
                    Expense claims and approvals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-orange-800">
                        Total Expenses
                      </p>
                      <p className="text-2xl font-bold text-orange-700">
                        {formatCurrency(analytics.budget.expenses.total)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {analytics.budget.expenses.count} expense claims
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        By Status
                      </p>
                      {analytics.budget.expenses.byStatus.map((status) => (
                        <div
                          key={status.status}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="capitalize">
                            {status.status.toLowerCase()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span>{status._count}</span>
                            <span className="text-gray-500">
                              ({formatCurrency(status._sum.amount)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget Categories */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    <span>By Category</span>
                  </CardTitle>
                  <CardDescription>
                    Budget allocation by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.budget.allocations.byCategory.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {category.category}
                          </span>
                          <span className="text-gray-600">
                            {category._count}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Allocated:{" "}
                            {formatCurrency(category._sum.allocatedAmount)}
                          </span>
                          <span>
                            Spent: {formatCurrency(category._sum.spentAmount)}
                          </span>
                        </div>
                        <Progress
                          value={
                            category._sum.allocatedAmount > 0
                              ? (category._sum.spentAmount /
                                  category._sum.allocatedAmount) *
                                100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Export Section */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Download className="h-5 w-5 text-gray-600" />
                  <span>Export Budget Data</span>
                </CardTitle>
                <CardDescription>
                  Download budget reports in various formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        "/api/budget/export?type=allocations&format=csv",
                        "_blank"
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Allocations CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        "/api/budget/export?type=expenses&format=csv",
                        "_blank"
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Expenses CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        "/api/budget/export?type=summary&format=csv",
                        "_blank"
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Summary CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        "/api/budget/export?type=allocations&format=json",
                        "_blank"
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    JSON Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
