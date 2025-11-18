"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Users,
  FolderOpen,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteCluster,
  getClusterById,
  reassignProjectsToCluster,
  getAllClusters,
} from "@/actions/clusters";
import { EditClusterForm } from "./edit-cluster-form";

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

interface ClusterManagementProps {
  cluster: Cluster;
  allClusters: Cluster[];
  onUpdate?: () => void;
}

export function ClusterManagement({
  cluster,
  allClusters,
  onUpdate,
}: ClusterManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [clusterProjects, setClusterProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [targetClusterId, setTargetClusterId] = useState<string>("");

  const handleViewProjects = () => {
    startTransition(async () => {
      try {
        const result = await getClusterById(cluster.id);
        if (result.success && result.cluster) {
          setClusterProjects(result.cluster.projects);
          setShowProjectsDialog(true);
        } else {
          toast.error(result.error || "Failed to fetch cluster projects");
        }
      } catch (error) {
        toast.error("An error occurred while fetching projects");
      }
    });
  };

  const handleDelete = () => {
    if (cluster._count.projects > 0) {
      toast.error(
        "Cannot delete cluster with active projects. Please reassign projects first."
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteCluster(cluster.id);
        if (result.success) {
          toast.success("Cluster deleted successfully");
          setShowDeleteDialog(false);
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to delete cluster");
        }
      } catch (error) {
        toast.error("An error occurred while deleting cluster");
      }
    });
  };

  const handleReassignProjects = () => {
    if (!targetClusterId) {
      toast.error("Please select a target cluster");
      return;
    }

    const projectsToReassign =
      selectedProjects.length > 0
        ? selectedProjects
        : clusterProjects.map((p) => p.id);

    startTransition(async () => {
      try {
        const result = await reassignProjectsToCluster(
          cluster.id,
          targetClusterId,
          projectsToReassign
        );

        if (result.success) {
          toast.success(
            `${result.reassignedCount} project${result.reassignedCount !== 1 ? "s" : ""} reassigned from ${result.fromCluster} to ${result.toCluster}`
          );
          setShowReassignDialog(false);
          setShowProjectsDialog(false);
          setSelectedProjects([]);
          setTargetClusterId("");
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to reassign projects");
        }
      } catch (error) {
        toast.error("An error occurred while reassigning projects");
      }
    });
  };

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects([...selectedProjects, projectId]);
    } else {
      setSelectedProjects(selectedProjects.filter((id) => id !== projectId));
    }
  };

  const handleSelectAllProjects = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(clusterProjects.map((p) => p.id));
    } else {
      setSelectedProjects([]);
    }
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

  const availableTargetClusters = allClusters.filter(
    (c) => c.id !== cluster.id
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <EditClusterForm
              cluster={cluster}
              onSuccess={onUpdate}
              trigger={
                <div className="flex items-center w-full cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Cluster
                </div>
              }
            />
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleViewProjects} disabled={isPending}>
            <FolderOpen className="h-4 w-4 mr-2" />
            View Projects ({cluster._count.projects})
          </DropdownMenuItem>

          {cluster._count.projects > 0 && (
            <DropdownMenuItem onClick={() => setShowReassignDialog(true)}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Reassign Projects
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Cluster
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Delete Cluster</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the cluster "{cluster.name}"?
              {cluster._count.projects > 0 ? (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    ⚠️ This cluster has {cluster._count.projects} active project
                    {cluster._count.projects !== 1 ? "s" : ""}.
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    You must reassign all projects to another cluster before
                    deletion.
                  </p>
                </div>
              ) : (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-700">
                    This action cannot be undone. The cluster will be
                    permanently removed.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending || cluster._count.projects > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete Cluster"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Projects Dialog */}
      <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: cluster.color || "#3B82F6" }}
              />
              <span>Projects in {cluster.name}</span>
              <Badge variant="outline">{clusterProjects.length} projects</Badge>
            </DialogTitle>
            <DialogDescription>
              View and manage projects in this cluster
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {clusterProjects.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={
                        selectedProjects.length === clusterProjects.length
                      }
                      onChange={(e) =>
                        handleSelectAllProjects(e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-sm">
                      Select All ({selectedProjects.length} selected)
                    </span>
                  </div>
                  {selectedProjects.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReassignDialog(true)}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Reassign Selected
                    </Button>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {clusterProjects.map((project) => (
                    <Card key={project.id} className="p-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(project.id)}
                          onChange={(e) =>
                            handleProjectSelection(project.id, e.target.checked)
                          }
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{project.name}</h4>
                            <Badge variant="outline">{project.projectId}</Badge>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace("_", " ")}
                            </Badge>
                            <Badge variant="outline">
                              {project.currentStage.replace("STAGE_", "Stage ")}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Lead: {project.lead.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No projects in this cluster</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Projects Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Projects</DialogTitle>
            <DialogDescription>
              Move projects from "{cluster.name}" to another cluster
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Reassignment Details
                </span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>
                  Projects to reassign:{" "}
                  {selectedProjects.length > 0
                    ? selectedProjects.length
                    : clusterProjects.length}
                </div>
                <div>From: {cluster.name}</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Target Cluster</label>
              <Select
                value={targetClusterId}
                onValueChange={setTargetClusterId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select target cluster" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargetClusters.map((targetCluster) => (
                    <SelectItem key={targetCluster.id} value={targetCluster.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: targetCluster.color || "#3B82F6",
                          }}
                        />
                        <span>{targetCluster.name}</span>
                        <span className="text-gray-500">
                          ({targetCluster._count.projects} projects)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetClusterId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  {selectedProjects.length > 0
                    ? selectedProjects.length
                    : clusterProjects.length}{" "}
                  project
                  {(selectedProjects.length > 0
                    ? selectedProjects.length
                    : clusterProjects.length) !== 1
                    ? "s"
                    : ""}{" "}
                  will be moved to{" "}
                  {
                    availableTargetClusters.find(
                      (c) => c.id === targetClusterId
                    )?.name
                  }
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowReassignDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassignProjects}
                disabled={isPending || !targetClusterId}
              >
                {isPending ? "Reassigning..." : "Reassign Projects"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
