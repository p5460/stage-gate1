"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  FolderOpen,
  Calendar,
  DollarSign,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
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

interface ClusterAnalyticsProps {
  clusters: Cluster[];
}

export function ClusterAnalytics({ clusters }: ClusterAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("projects");

  // Calculate analytics data
  const totalProjects = clusters.reduce(
    (sum, cluster) => sum + cluster._count.projects,
    0
  );
  const activeClusters = clusters.filter((c) => c._count.projects > 0).length;
  const averageProjectsPerCluster =
    clusters.length > 0 ? Math.round(totalProjects / clusters.length) : 0;
  const maxProjectsInCluster = Math.max(
    ...clusters.map((c) => c._count.projects),
    0
  );

  // Get cluster distribution data
  const getClusterDistribution = () => {
    return clusters
      .filter((c) => c._count.projects > 0)
      .sort((a, b) => b._count.projects - a._count.projects)
      .slice(0, 10); // Top 10 clusters
  };

  // Get project status distribution across all clusters
  const getProjectStatusDistribution = () => {
    const statusCounts: { [key: string]: number } = {};

    clusters.forEach((cluster) => {
      if (cluster.projects) {
        cluster.projects.forEach((project) => {
          statusCounts[project.status] =
            (statusCounts[project.status] || 0) + 1;
        });
      }
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage:
        totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
    }));
  };

  // Get stage distribution across all clusters
  const getStageDistribution = () => {
    const stageCounts: { [key: string]: number } = {};

    clusters.forEach((cluster) => {
      if (cluster.projects) {
        cluster.projects.forEach((project) => {
          stageCounts[project.currentStage] =
            (stageCounts[project.currentStage] || 0) + 1;
        });
      }
    });

    return Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      count,
      percentage:
        totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0,
    }));
  };

  // Get budget analytics
  const getBudgetAnalytics = () => {
    let totalBudget = 0;
    let totalUtilized = 0;
    let projectsWithBudget = 0;

    clusters.forEach((cluster) => {
      if (cluster.projects) {
        cluster.projects.forEach((project) => {
          if (project.budget && project.budget > 0) {
            totalBudget += project.budget;
            totalUtilized +=
              (project.budget * (project.budgetUtilization || 0)) / 100;
            projectsWithBudget++;
          }
        });
      }
    });

    return {
      totalBudget,
      totalUtilized,
      utilizationPercentage:
        totalBudget > 0 ? Math.round((totalUtilized / totalBudget) * 100) : 0,
      projectsWithBudget,
      averageBudget:
        projectsWithBudget > 0
          ? Math.round(totalBudget / projectsWithBudget)
          : 0,
    };
  };

  const clusterDistribution = getClusterDistribution();
  const statusDistribution = getProjectStatusDistribution();
  const stageDistribution = getStageDistribution();
  const budgetAnalytics = getBudgetAnalytics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "ON_HOLD":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "TERMINATED":
        return "bg-gray-100 text-gray-800";
      case "RED_FLAG":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-end items-center space-x-2">
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="projects">Projects</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Clusters
                </p>
                <p className="text-3xl font-bold">{clusters.length}</p>
                <p className="text-sm text-gray-500">{activeClusters} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Projects
                </p>
                <p className="text-3xl font-bold">{totalProjects}</p>
                <p className="text-sm text-gray-500">
                  Avg {averageProjectsPerCluster}/cluster
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
                <p className="text-3xl font-bold">
                  R{(budgetAnalytics.totalBudget / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-gray-500">
                  {budgetAnalytics.utilizationPercentage}% utilized
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Largest Cluster
                </p>
                <p className="text-3xl font-bold">{maxProjectsInCluster}</p>
                <p className="text-sm text-gray-500">projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Cluster Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clusterDistribution.map((cluster, index) => (
              <div key={cluster.id} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-sm font-medium w-6">{index + 1}</span>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: cluster.color || "#3B82F6" }}
                  />
                  <span className="font-medium">{cluster.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(cluster._count.projects / maxProjectsInCluster) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">
                    {cluster._count.projects}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status and Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Project Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusDistribution.map(({ status, count, percentage }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status)}>
                      {status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Project Stage Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageDistribution.map(({ stage, count, percentage }) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStageColor(stage)}>
                      {stage.replace("STAGE_", "Stage ")}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Budget Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-blue-600">
                R{(budgetAnalytics.totalBudget / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Utilized</p>
              <p className="text-2xl font-bold text-green-600">
                R{(budgetAnalytics.totalUtilized / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Utilization Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {budgetAnalytics.utilizationPercentage}%
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Avg Budget</p>
              <p className="text-2xl font-bold text-orange-600">
                R{(budgetAnalytics.averageBudget / 1000).toFixed(0)}K
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Overall Budget Utilization
              </span>
              <span className="text-sm text-gray-500">
                {budgetAnalytics.utilizationPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  budgetAnalytics.utilizationPercentage > 90
                    ? "bg-red-600"
                    : budgetAnalytics.utilizationPercentage > 75
                      ? "bg-yellow-600"
                      : "bg-green-600"
                }`}
                style={{ width: `${budgetAnalytics.utilizationPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Strengths
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  • {activeClusters} out of {clusters.length} clusters are
                  actively managing projects
                </li>
                <li>
                  • Average of {averageProjectsPerCluster} projects per cluster
                  shows good distribution
                </li>
                <li>
                  • Budget utilization at{" "}
                  {budgetAnalytics.utilizationPercentage}% indicates{" "}
                  {budgetAnalytics.utilizationPercentage < 80
                    ? "conservative"
                    : "active"}{" "}
                  spending
                </li>
                <li>
                  •{" "}
                  {statusDistribution.find((s) => s.status === "COMPLETED")
                    ?.count || 0}{" "}
                  completed projects demonstrate delivery capability
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-orange-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  • {clusters.length - activeClusters} clusters have no active
                  projects
                </li>
                <li>
                  •{" "}
                  {statusDistribution.find((s) => s.status === "RED_FLAG")
                    ?.count || 0}{" "}
                  projects flagged for attention
                </li>
                <li>
                  •{" "}
                  {statusDistribution.find((s) => s.status === "ON_HOLD")
                    ?.count || 0}{" "}
                  projects on hold may need review
                </li>
                <li>• Consider consolidating underutilized clusters</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
