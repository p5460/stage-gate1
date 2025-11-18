"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Info,
  Zap,
  Target,
  Users,
} from "lucide-react";

interface Cluster {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  _count: {
    projects: number;
  };
  projects?: Project[];
}

interface Project {
  id: string;
  projectId: string;
  name: string;
  status: string;
  currentStage: string;
  budget?: number | null;
  budgetUtilization?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  lead: {
    name: string | null;
    email: string | null;
  };
}

interface ClusterHealthMetrics {
  id: string;
  name: string;
  color: string;
  healthScore: number;
  status: "healthy" | "warning" | "critical" | "inactive";
  metrics: {
    projectCount: number;
    activeProjects: number;
    completedProjects: number;
    redFlagProjects: number;
    avgBudgetUtilization: number;
    avgProjectDuration: number;
    recentActivity: number;
  };
  issues: string[];
  recommendations: string[];
  trend: "up" | "down" | "stable";
}

interface ClusterHealthMonitorProps {
  clusters: Cluster[];
}

export function ClusterHealthMonitor({ clusters }: ClusterHealthMonitorProps) {
  const [healthMetrics, setHealthMetrics] = useState<ClusterHealthMetrics[]>(
    []
  );
  const [sortBy, setSortBy] = useState<"health" | "projects" | "activity">(
    "health"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "healthy" | "warning" | "critical" | "inactive"
  >("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate health metrics for each cluster
  const calculateHealthMetrics = (): ClusterHealthMetrics[] => {
    return clusters.map((cluster) => {
      const projects = cluster.projects || [];
      const activeProjects = projects.filter(
        (p) => p.status === "ACTIVE"
      ).length;
      const completedProjects = projects.filter(
        (p) => p.status === "COMPLETED"
      ).length;
      const redFlagProjects = projects.filter(
        (p) => p.status === "RED_FLAG"
      ).length;
      const onHoldProjects = projects.filter(
        (p) => p.status === "ON_HOLD"
      ).length;

      // Calculate average budget utilization
      const projectsWithBudget = projects.filter(
        (p) => p.budget && p.budget > 0
      );
      const avgBudgetUtilization =
        projectsWithBudget.length > 0
          ? projectsWithBudget.reduce(
              (sum, p) => sum + (p.budgetUtilization || 0),
              0
            ) / projectsWithBudget.length
          : 0;

      // Calculate average project duration (simplified)
      const projectsWithDates = projects.filter(
        (p) => p.startDate && p.endDate
      );
      const avgProjectDuration =
        projectsWithDates.length > 0
          ? projectsWithDates.reduce((sum, p) => {
              const start = new Date(p.startDate!);
              const end = new Date(p.endDate!);
              return (
                sum +
                Math.abs(end.getTime() - start.getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              ); // months
            }, 0) / projectsWithDates.length
          : 0;

      // Calculate health score (0-100)
      let healthScore = 100;
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Deduct points for various issues
      if (cluster._count.projects === 0) {
        healthScore -= 50;
        issues.push("No active projects");
        recommendations.push(
          "Consider assigning projects or merging with active cluster"
        );
      }

      if (redFlagProjects > 0) {
        healthScore -= (redFlagProjects / cluster._count.projects) * 30;
        issues.push(
          `${redFlagProjects} project${redFlagProjects !== 1 ? "s" : ""} with red flags`
        );
        recommendations.push("Address red flag issues immediately");
      }

      if (onHoldProjects > cluster._count.projects * 0.3) {
        healthScore -= 20;
        issues.push("High percentage of projects on hold");
        recommendations.push("Review and reactivate on-hold projects");
      }

      if (avgBudgetUtilization > 90) {
        healthScore -= 15;
        issues.push("High budget utilization");
        recommendations.push(
          "Monitor budget closely or request additional funding"
        );
      }

      if (activeProjects === 0 && cluster._count.projects > 0) {
        healthScore -= 25;
        issues.push("No active projects despite having projects");
        recommendations.push(
          "Review project statuses and reactivate if needed"
        );
      }

      // Determine status based on health score
      let status: "healthy" | "warning" | "critical" | "inactive";
      if (cluster._count.projects === 0) {
        status = "inactive";
      } else if (healthScore >= 80) {
        status = "healthy";
      } else if (healthScore >= 60) {
        status = "warning";
      } else {
        status = "critical";
      }

      // Determine trend (simplified - would use historical data in real app)
      const trend: "up" | "down" | "stable" =
        completedProjects > redFlagProjects
          ? "up"
          : redFlagProjects > completedProjects
            ? "down"
            : "stable";

      return {
        id: cluster.id,
        name: cluster.name,
        color: cluster.color || "#3B82F6",
        healthScore: Math.max(0, Math.round(healthScore)),
        status,
        metrics: {
          projectCount: cluster._count.projects,
          activeProjects,
          completedProjects,
          redFlagProjects,
          avgBudgetUtilization: Math.round(avgBudgetUtilization),
          avgProjectDuration: Math.round(avgProjectDuration),
          recentActivity: activeProjects + completedProjects, // Simplified
        },
        issues,
        recommendations,
        trend,
      };
    });
  };

  useEffect(() => {
    setHealthMetrics(calculateHealthMetrics());
  }, [clusters]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHealthMetrics(calculateHealthMetrics());
      setIsRefreshing(false);
    }, 1000);
  };

  // Filter and sort metrics
  const filteredMetrics = healthMetrics
    .filter(
      (metric) => filterStatus === "all" || metric.status === filterStatus
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "health":
          return b.healthScore - a.healthScore;
        case "projects":
          return b.metrics.projectCount - a.metrics.projectCount;
        case "activity":
          return b.metrics.recentActivity - a.metrics.recentActivity;
        default:
          return 0;
      }
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBarColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const overallStats = {
    total: healthMetrics.length,
    healthy: healthMetrics.filter((m) => m.status === "healthy").length,
    warning: healthMetrics.filter((m) => m.status === "warning").length,
    critical: healthMetrics.filter((m) => m.status === "critical").length,
    inactive: healthMetrics.filter((m) => m.status === "inactive").length,
    avgHealth:
      healthMetrics.length > 0
        ? Math.round(
            healthMetrics.reduce((sum, m) => sum + m.healthScore, 0) /
              healthMetrics.length
          )
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-end items-center space-x-2">
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="health">Health Score</SelectItem>
            <SelectItem value="projects">Project Count</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(value: any) => setFilterStatus(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{overallStats.total}</div>
            <div className="text-sm text-gray-600">Total Clusters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {overallStats.healthy}
            </div>
            <div className="text-sm text-gray-600">Healthy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {overallStats.warning}
            </div>
            <div className="text-sm text-gray-600">Warning</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {overallStats.critical}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {overallStats.inactive}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div
              className={`text-2xl font-bold ${getHealthColor(overallStats.avgHealth)}`}
            >
              {overallStats.avgHealth}%
            </div>
            <div className="text-sm text-gray-600">Avg Health</div>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics */}
      <div className="space-y-4">
        {filteredMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: metric.color }}
                  />
                  <CardTitle className="text-lg">{metric.name}</CardTitle>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${getHealthColor(metric.healthScore)}`}
                    >
                      {metric.healthScore}%
                    </div>
                    <div className="text-sm text-gray-600">Health Score</div>
                  </div>
                  {getStatusIcon(metric.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Health Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Health Score</span>
                    <span>{metric.healthScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getHealthBarColor(metric.healthScore)}`}
                      style={{ width: `${metric.healthScore}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-lg font-bold">
                            {metric.metrics.projectCount}
                          </div>
                          <div className="text-sm text-gray-600">Projects</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total projects in cluster</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Zap className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="text-lg font-bold">
                            {metric.metrics.activeProjects}
                          </div>
                          <div className="text-sm text-gray-600">Active</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Currently active projects</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <CheckCircle className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="text-lg font-bold">
                            {metric.metrics.completedProjects}
                          </div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Successfully completed projects</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Target className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="text-lg font-bold">
                            {metric.metrics.avgBudgetUtilization}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Budget Use
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average budget utilization across projects</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Issues and Recommendations */}
                {(metric.issues.length > 0 ||
                  metric.recommendations.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metric.issues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Issues
                        </h4>
                        <ul className="text-sm space-y-1">
                          {metric.issues.map((issue, index) => (
                            <li key={index} className="text-red-700">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {metric.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Recommendations
                        </h4>
                        <ul className="text-sm space-y-1">
                          {metric.recommendations.map((rec, index) => (
                            <li key={index} className="text-blue-700">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMetrics.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No clusters match the selected filter
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
