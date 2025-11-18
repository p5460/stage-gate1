"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  Users,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { getClusterById } from "@/actions/clusters";
import { EditClusterForm } from "./edit-cluster-form";
import { ClusterManagement } from "./cluster-management";

interface Cluster {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  _count: {
    projects: number;
  };
}

interface Project {
  id: string;
  projectId: string;
  name: string;
  status: string;
  currentStage: string;
  lead: {
    name: string | null;
    email: string | null;
  };
}

interface ClusterDetailsProps {
  cluster: Cluster;
  allClusters: Cluster[];
  onUpdate?: () => void;
  trigger?: React.ReactNode;
}

export function ClusterDetails({
  cluster,
  allClusters,
  onUpdate,
  trigger,
}: ClusterDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [clusterData, setClusterData] = useState<any>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !clusterData) {
      loadClusterDetails();
    }
  };

  const loadClusterDetails = () => {
    startTransition(async () => {
      try {
        const result = await getClusterById(cluster.id);
        if (result.success && result.cluster) {
          setClusterData(result.cluster);
        } else {
          toast.error(result.error || "Failed to load cluster details");
        }
      } catch (error) {
        toast.error("An error occurred while loading cluster details");
      }
    });
  };

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

  const getProjectStats = () => {
    if (!clusterData?.projects) return null;

    const projects = clusterData.projects;
    const statusCounts = projects.reduce((acc: any, project: Project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    const stageCounts = projects.reduce((acc: any, project: Project) => {
      acc[project.currentStage] = (acc[project.currentStage] || 0) + 1;
      return acc;
    }, {});

    return { statusCounts, stageCounts };
  };

  const stats = getProjectStats();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: cluster.color || "#3B82F6" }}
            />
            <span>{cluster.name}</span>
            <Badge variant="outline">{cluster._count.projects} projects</Badge>
          </DialogTitle>
          <DialogDescription>
            Detailed view of cluster information and projects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cluster Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Cluster Information</CardTitle>
                <div className="flex items-center space-x-2">
                  <EditClusterForm
                    cluster={cluster}
                    onSuccess={() => {
                      onUpdate?.();
                      loadClusterDetails();
                    }}
                  />
                  <ClusterManagement
                    cluster={cluster}
                    allClusters={allClusters}
                    onUpdate={() => {
                      onUpdate?.();
                      setIsOpen(false);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600">
                    Description
                  </h4>
                  <p className="mt-1">
                    {cluster.description || "No description provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">Color</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: cluster.color || "#3B82F6" }}
                      />
                      <span className="font-mono text-sm">
                        {cluster.color || "#3B82F6"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-600">
                      Total Projects
                    </h4>
                    <p className="mt-1 text-2xl font-bold">
                      {cluster._count.projects}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Statistics */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Project Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Distribution */}
                  <div>
                    <h4 className="font-medium mb-3">Status Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.statusCounts).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="flex items-center justify-between"
                          >
                            <Badge className={getStatusColor(status)}>
                              {status.replace("_", " ")}
                            </Badge>
                            <span className="font-medium">
                              {count as number}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Stage Distribution */}
                  <div>
                    <h4 className="font-medium mb-3">Stage Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.stageCounts).map(
                        ([stage, count]) => (
                          <div
                            key={stage}
                            className="flex items-center justify-between"
                          >
                            <Badge className={getStageColor(stage)}>
                              {stage.replace("STAGE_", "Stage ")}
                            </Badge>
                            <span className="font-medium">
                              {count as number}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Projects in this Cluster</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading projects...</p>
                </div>
              ) : clusterData?.projects && clusterData.projects.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clusterData.projects.map((project: Project) => (
                    <div
                      key={project.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{project.name}</h4>
                            <Badge variant="outline">{project.projectId}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace("_", " ")}
                            </Badge>
                            <Badge
                              className={getStageColor(project.currentStage)}
                            >
                              {project.currentStage.replace("STAGE_", "Stage ")}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Lead: {project.lead.name}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No projects in this cluster</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Activity tracking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
