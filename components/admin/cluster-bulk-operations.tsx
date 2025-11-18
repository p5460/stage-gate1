"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Trash2,
  Edit,
  Copy,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Palette,
  FileText,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateCluster,
  deleteCluster,
  reassignProjectsToCluster,
  createCluster,
} from "@/actions/clusters";

interface Cluster {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  _count: {
    projects: number;
  };
}

interface ClusterBulkOperationsProps {
  clusters: Cluster[];
  onUpdate?: () => void;
  trigger?: React.ReactNode;
}

export function ClusterBulkOperations({
  clusters,
  onUpdate,
  trigger,
}: ClusterBulkOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [operation, setOperation] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Operation-specific states
  const [bulkEditData, setBulkEditData] = useState({
    color: "",
    description: "",
    appendDescription: false,
  });

  const [mergeData, setMergeData] = useState({
    targetClusterId: "",
    newName: "",
    newDescription: "",
    newColor: "",
    deleteSource: true,
  });

  const [duplicateData, setDuplicateData] = useState({
    namePrefix: "Copy of ",
    nameSuffix: "",
    includeProjects: false,
    newColor: "",
  });

  const handleClusterSelection = (clusterId: string, checked: boolean) => {
    if (checked) {
      setSelectedClusters([...selectedClusters, clusterId]);
    } else {
      setSelectedClusters(selectedClusters.filter((id) => id !== clusterId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClusters(clusters.map((c) => c.id));
    } else {
      setSelectedClusters([]);
    }
  };

  const getSelectedClusters = () => {
    return clusters.filter((c) => selectedClusters.includes(c.id));
  };

  const handleBulkEdit = () => {
    const selected = getSelectedClusters();

    startTransition(async () => {
      try {
        const promises = selected.map((cluster) => {
          const updateData: any = {};

          if (bulkEditData.color) {
            updateData.color = bulkEditData.color;
          }

          if (bulkEditData.description) {
            if (bulkEditData.appendDescription && cluster.description) {
              updateData.description = `${cluster.description}\n\n${bulkEditData.description}`;
            } else {
              updateData.description = bulkEditData.description;
            }
          }

          return updateCluster(cluster.id, updateData);
        });

        const results = await Promise.all(promises);
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        if (successful > 0) {
          toast.success(
            `${successful} cluster${successful !== 1 ? "s" : ""} updated successfully`
          );
        }
        if (failed > 0) {
          toast.error(
            `${failed} cluster${failed !== 1 ? "s" : ""} failed to update`
          );
        }

        setIsOpen(false);
        setSelectedClusters([]);
        onUpdate?.();
      } catch (error) {
        toast.error("An error occurred during bulk edit");
      }
    });
  };

  const handleBulkDelete = () => {
    const selected = getSelectedClusters();
    const clustersWithProjects = selected.filter((c) => c._count.projects > 0);

    if (clustersWithProjects.length > 0) {
      toast.error(
        `Cannot delete ${clustersWithProjects.length} cluster${clustersWithProjects.length !== 1 ? "s" : ""} with active projects`
      );
      return;
    }

    startTransition(async () => {
      try {
        const promises = selected.map((cluster) => deleteCluster(cluster.id));
        const results = await Promise.all(promises);

        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        if (successful > 0) {
          toast.success(
            `${successful} cluster${successful !== 1 ? "s" : ""} deleted successfully`
          );
        }
        if (failed > 0) {
          toast.error(
            `${failed} cluster${failed !== 1 ? "s" : ""} failed to delete`
          );
        }

        setShowConfirmDialog(false);
        setIsOpen(false);
        setSelectedClusters([]);
        onUpdate?.();
      } catch (error) {
        toast.error("An error occurred during bulk delete");
      }
    });
  };

  const handleMergeClusters = () => {
    if (!mergeData.targetClusterId || selectedClusters.length < 2) {
      toast.error("Please select at least 2 clusters and a target cluster");
      return;
    }

    const sourceClusters = selectedClusters.filter(
      (id) => id !== mergeData.targetClusterId
    );

    startTransition(async () => {
      try {
        // Reassign all projects to target cluster
        const reassignPromises = sourceClusters.map((sourceId) =>
          reassignProjectsToCluster(sourceId, mergeData.targetClusterId)
        );

        await Promise.all(reassignPromises);

        // Update target cluster if new data provided
        if (
          mergeData.newName ||
          mergeData.newDescription ||
          mergeData.newColor
        ) {
          const updateData: any = {};
          if (mergeData.newName) updateData.name = mergeData.newName;
          if (mergeData.newDescription)
            updateData.description = mergeData.newDescription;
          if (mergeData.newColor) updateData.color = mergeData.newColor;

          await updateCluster(mergeData.targetClusterId, updateData);
        }

        // Delete source clusters if requested
        if (mergeData.deleteSource) {
          const deletePromises = sourceClusters.map((sourceId) =>
            deleteCluster(sourceId)
          );
          await Promise.all(deletePromises);
        }

        toast.success(`Successfully merged ${sourceClusters.length} clusters`);
        setIsOpen(false);
        setSelectedClusters([]);
        onUpdate?.();
      } catch (error) {
        toast.error("An error occurred during cluster merge");
      }
    });
  };

  const handleDuplicateClusters = () => {
    const selected = getSelectedClusters();

    startTransition(async () => {
      try {
        const promises = selected.map((cluster) => {
          const newName = `${duplicateData.namePrefix}${cluster.name}${duplicateData.nameSuffix}`;
          return createCluster({
            name: newName,
            description: cluster.description || undefined,
            color: duplicateData.newColor || cluster.color || undefined,
          });
        });

        const results = await Promise.all(promises);
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        if (successful > 0) {
          toast.success(
            `${successful} cluster${successful !== 1 ? "s" : ""} duplicated successfully`
          );
        }
        if (failed > 0) {
          toast.error(
            `${failed} cluster${failed !== 1 ? "s" : ""} failed to duplicate`
          );
        }

        setIsOpen(false);
        setSelectedClusters([]);
        onUpdate?.();
      } catch (error) {
        toast.error("An error occurred during cluster duplication");
      }
    });
  };

  const executeOperation = () => {
    switch (operation) {
      case "edit":
        handleBulkEdit();
        break;
      case "delete":
        setShowConfirmDialog(true);
        break;
      case "merge":
        handleMergeClusters();
        break;
      case "duplicate":
        handleDuplicateClusters();
        break;
      default:
        toast.error("Please select an operation");
    }
  };

  const renderOperationForm = () => {
    switch (operation) {
      case "edit":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkColor">Update Color (optional)</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="bulkColor"
                  type="color"
                  value={bulkEditData.color}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, color: e.target.value })
                  }
                  className="w-16 h-10"
                />
                <span className="text-sm text-gray-500">
                  Leave empty to keep existing colors
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="bulkDescription">
                Update Description (optional)
              </Label>
              <Textarea
                id="bulkDescription"
                value={bulkEditData.description}
                onChange={(e) =>
                  setBulkEditData({
                    ...bulkEditData,
                    description: e.target.value,
                  })
                }
                placeholder="New description for selected clusters"
                rows={3}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="appendDescription"
                  checked={bulkEditData.appendDescription}
                  onCheckedChange={(checked) =>
                    setBulkEditData({
                      ...bulkEditData,
                      appendDescription: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="appendDescription" className="text-sm">
                  Append to existing description instead of replacing
                </Label>
              </div>
            </div>
          </div>
        );

      case "merge":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="targetCluster">Target Cluster</Label>
              <Select
                value={mergeData.targetClusterId}
                onValueChange={(value) =>
                  setMergeData({ ...mergeData, targetClusterId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target cluster" />
                </SelectTrigger>
                <SelectContent>
                  {clusters
                    .filter((c) => selectedClusters.includes(c.id))
                    .map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: cluster.color || "#3B82F6",
                            }}
                          />
                          <span>{cluster.name}</span>
                          <span className="text-gray-500">
                            ({cluster._count.projects} projects)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="newName">New Name (optional)</Label>
              <Input
                id="newName"
                value={mergeData.newName}
                onChange={(e) =>
                  setMergeData({ ...mergeData, newName: e.target.value })
                }
                placeholder="Leave empty to keep target cluster name"
              />
            </div>

            <div>
              <Label htmlFor="newDescription">New Description (optional)</Label>
              <Textarea
                id="newDescription"
                value={mergeData.newDescription}
                onChange={(e) =>
                  setMergeData({ ...mergeData, newDescription: e.target.value })
                }
                placeholder="Leave empty to keep target cluster description"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteSource"
                checked={mergeData.deleteSource}
                onCheckedChange={(checked) =>
                  setMergeData({
                    ...mergeData,
                    deleteSource: checked as boolean,
                  })
                }
              />
              <Label htmlFor="deleteSource" className="text-sm">
                Delete source clusters after merge
              </Label>
            </div>
          </div>
        );

      case "duplicate":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namePrefix">Name Prefix</Label>
                <Input
                  id="namePrefix"
                  value={duplicateData.namePrefix}
                  onChange={(e) =>
                    setDuplicateData({
                      ...duplicateData,
                      namePrefix: e.target.value,
                    })
                  }
                  placeholder="Copy of "
                />
              </div>
              <div>
                <Label htmlFor="nameSuffix">Name Suffix</Label>
                <Input
                  id="nameSuffix"
                  value={duplicateData.nameSuffix}
                  onChange={(e) =>
                    setDuplicateData({
                      ...duplicateData,
                      nameSuffix: e.target.value,
                    })
                  }
                  placeholder=" - Backup"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duplicateColor">New Color (optional)</Label>
              <Input
                id="duplicateColor"
                type="color"
                value={duplicateData.newColor}
                onChange={(e) =>
                  setDuplicateData({
                    ...duplicateData,
                    newColor: e.target.value,
                  })
                }
                className="w-16 h-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeProjects"
                checked={duplicateData.includeProjects}
                onCheckedChange={(checked) =>
                  setDuplicateData({
                    ...duplicateData,
                    includeProjects: checked as boolean,
                  })
                }
                disabled
              />
              <Label
                htmlFor="includeProjects"
                className="text-sm text-gray-500"
              >
                Include projects (not implemented)
              </Label>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Select an operation to configure options
            </p>
          </div>
        );
    }
  };

  const getOperationDescription = () => {
    const count = selectedClusters.length;
    switch (operation) {
      case "edit":
        return `Update properties for ${count} selected cluster${count !== 1 ? "s" : ""}`;
      case "delete":
        return `Delete ${count} selected cluster${count !== 1 ? "s" : ""} (only empty clusters)`;
      case "merge":
        return `Merge ${count} selected clusters into one`;
      case "duplicate":
        return `Create copies of ${count} selected cluster${count !== 1 ? "s" : ""}`;
      default:
        return "Select an operation to see description";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Bulk Operations
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Cluster Operations</DialogTitle>
            <DialogDescription>
              Perform operations on multiple clusters simultaneously
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cluster Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Select Clusters ({selectedClusters.length} selected)
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedClusters.length === clusters.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="selectAll" className="text-sm">
                      Select All
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {clusters.map((cluster) => (
                    <div
                      key={cluster.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        selectedClusters.includes(cluster.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`cluster-${cluster.id}`}
                          checked={selectedClusters.includes(cluster.id)}
                          onCheckedChange={(checked) =>
                            handleClusterSelection(
                              cluster.id,
                              checked as boolean
                            )
                          }
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: cluster.color || "#3B82F6",
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{cluster.name}</h4>
                            <Badge variant="outline">
                              {cluster._count.projects} projects
                            </Badge>
                          </div>
                          {cluster.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {cluster.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Operation Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Operation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant={operation === "edit" ? "default" : "outline"}
                    onClick={() => setOperation("edit")}
                    className="h-20 flex-col"
                    disabled={selectedClusters.length === 0}
                  >
                    <Edit className="h-6 w-6 mb-2" />
                    <span>Bulk Edit</span>
                  </Button>

                  <Button
                    variant={operation === "delete" ? "default" : "outline"}
                    onClick={() => setOperation("delete")}
                    className="h-20 flex-col"
                    disabled={selectedClusters.length === 0}
                  >
                    <Trash2 className="h-6 w-6 mb-2" />
                    <span>Bulk Delete</span>
                  </Button>

                  <Button
                    variant={operation === "merge" ? "default" : "outline"}
                    onClick={() => setOperation("merge")}
                    className="h-20 flex-col"
                    disabled={selectedClusters.length < 2}
                  >
                    <ArrowRight className="h-6 w-6 mb-2" />
                    <span>Merge</span>
                  </Button>

                  <Button
                    variant={operation === "duplicate" ? "default" : "outline"}
                    onClick={() => setOperation("duplicate")}
                    className="h-20 flex-col"
                    disabled={selectedClusters.length === 0}
                  >
                    <Copy className="h-6 w-6 mb-2" />
                    <span>Duplicate</span>
                  </Button>
                </div>

                {operation && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {getOperationDescription()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operation Configuration */}
            {operation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configure Operation</CardTitle>
                </CardHeader>
                <CardContent>{renderOperationForm()}</CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={executeOperation}
                disabled={
                  isPending || selectedClusters.length === 0 || !operation
                }
              >
                {isPending ? "Processing..." : "Execute Operation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Confirm Bulk Delete</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedClusters.length} cluster
              {selectedClusters.length !== 1 ? "s" : ""}?
              <div className="mt-4 space-y-2">
                {getSelectedClusters().map((cluster) => (
                  <div
                    key={cluster.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cluster.color || "#3B82F6" }}
                      />
                      <span className="font-medium">{cluster.name}</span>
                    </div>
                    <Badge
                      variant={
                        cluster._count.projects > 0
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {cluster._count.projects} projects
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  This action cannot be undone. Only clusters without projects
                  can be deleted.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete Clusters"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
