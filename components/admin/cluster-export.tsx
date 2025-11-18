"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileText,
  Database,
  BarChart3,
  CheckCircle,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

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

interface ClusterExportProps {
  clusters: Cluster[];
  selectedClusters?: string[];
  trigger?: React.ReactNode;
}

export function ClusterExport({
  clusters,
  selectedClusters = [],
  trigger,
}: ClusterExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [exportType, setExportType] = useState<"summary" | "detailed">(
    "summary"
  );
  const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>(
    selectedClusters.length > 0 ? selectedClusters : []
  );
  const [includeOptions, setIncludeOptions] = useState({
    projects: true,
    statistics: true,
    metadata: true,
    analytics: false,
  });

  const handleClusterToggle = (clusterId: string, checked: boolean) => {
    if (checked) {
      setSelectedClusterIds([...selectedClusterIds, clusterId]);
    } else {
      setSelectedClusterIds(
        selectedClusterIds.filter((id) => id !== clusterId)
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClusterIds(clusters.map((c) => c.id));
    } else {
      setSelectedClusterIds([]);
    }
  };

  const generateExportData = () => {
    const selectedClusters = clusters.filter((c) =>
      selectedClusterIds.includes(c.id)
    );

    if (exportFormat === "json") {
      const exportData: any = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          format: exportFormat,
          type: exportType,
          totalClusters: selectedClusters.length,
          includeOptions,
        },
        clusters: selectedClusters.map((cluster) => {
          const clusterData: any = {
            id: cluster.id,
            name: cluster.name,
            description: cluster.description,
            color: cluster.color,
            projectCount: cluster._count.projects,
          };

          if (includeOptions.metadata) {
            clusterData.metadata = {
              createdAt: new Date().toISOString(), // Would be actual creation date
              updatedAt: new Date().toISOString(), // Would be actual update date
            };
          }

          if (includeOptions.projects && cluster.projects) {
            clusterData.projects = cluster.projects.map((project) => ({
              id: project.id,
              projectId: project.projectId,
              name: project.name,
              status: project.status,
              currentStage: project.currentStage,
              budget: project.budget,
              budgetUtilization: project.budgetUtilization,
              startDate: project.startDate,
              endDate: project.endDate,
              lead: project.lead,
            }));
          }

          if (includeOptions.statistics) {
            const projects = cluster.projects || [];
            const statusCounts = projects.reduce((acc: any, project) => {
              acc[project.status] = (acc[project.status] || 0) + 1;
              return acc;
            }, {});

            const stageCounts = projects.reduce((acc: any, project) => {
              acc[project.currentStage] = (acc[project.currentStage] || 0) + 1;
              return acc;
            }, {});

            const totalBudget = projects.reduce(
              (sum, p) => sum + (p.budget || 0),
              0
            );
            const avgUtilization =
              projects.length > 0
                ? projects.reduce(
                    (sum, p) => sum + (p.budgetUtilization || 0),
                    0
                  ) / projects.length
                : 0;

            clusterData.statistics = {
              statusDistribution: statusCounts,
              stageDistribution: stageCounts,
              budgetSummary: {
                totalBudget,
                averageUtilization: Math.round(avgUtilization),
                projectsWithBudget: projects.filter(
                  (p) => p.budget && p.budget > 0
                ).length,
              },
            };
          }

          return clusterData;
        }),
      };

      if (includeOptions.analytics) {
        const allProjects = selectedClusters.flatMap((c) => c.projects || []);
        const totalBudget = allProjects.reduce(
          (sum, p) => sum + (p.budget || 0),
          0
        );
        const totalProjects = allProjects.length;

        exportData.analytics = {
          summary: {
            totalClusters: selectedClusters.length,
            totalProjects,
            totalBudget,
            averageProjectsPerCluster: Math.round(
              totalProjects / selectedClusters.length
            ),
          },
          distribution: {
            clusterSizes: selectedClusters.map((c) => ({
              name: c.name,
              projectCount: c._count.projects,
              percentage: Math.round((c._count.projects / totalProjects) * 100),
            })),
          },
        };
      }

      return JSON.stringify(exportData, null, 2);
    } else {
      // CSV format
      if (exportType === "summary") {
        const csvData = [
          "Name,Description,Color,Project Count,Status",
          ...selectedClusters.map(
            (cluster) =>
              `"${cluster.name}","${cluster.description || ""}","${cluster.color || ""}",${cluster._count.projects},"${cluster._count.projects > 0 ? "Active" : "Inactive"}"`
          ),
        ].join("\n");
        return csvData;
      } else {
        // Detailed CSV with projects
        const csvData = [
          "Cluster Name,Cluster Description,Cluster Color,Project ID,Project Name,Status,Stage,Budget,Utilization,Lead Name,Lead Email,Start Date,End Date",
        ];

        selectedClusters.forEach((cluster) => {
          if (cluster.projects && cluster.projects.length > 0) {
            cluster.projects.forEach((project) => {
              csvData.push(
                `"${cluster.name}","${cluster.description || ""}","${cluster.color || ""}","${project.projectId}","${project.name}","${project.status}","${project.currentStage}","${project.budget || 0}","${project.budgetUtilization || 0}","${project.lead.name || ""}","${project.lead.email || ""}","${project.startDate || ""}","${project.endDate || ""}"`
              );
            });
          } else {
            csvData.push(
              `"${cluster.name}","${cluster.description || ""}","${cluster.color || ""}","","","","","","","","","",""`
            );
          }
        });

        return csvData.join("\n");
      }
    }
  };

  const handleExport = () => {
    if (selectedClusterIds.length === 0) {
      toast.error("Please select at least one cluster to export");
      return;
    }

    startTransition(async () => {
      try {
        const exportData = generateExportData();
        const filename = `clusters-export-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
        const mimeType =
          exportFormat === "json" ? "application/json" : "text/csv";

        // Create and download file
        const blob = new Blob([exportData], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(
          `${selectedClusterIds.length} cluster${selectedClusterIds.length > 1 ? "s" : ""} exported successfully`
        );
        setIsOpen(false);
      } catch (error) {
        console.error("Export error:", error);
        toast.error("An error occurred while exporting clusters");
      }
    });
  };

  const getEstimatedFileSize = () => {
    const selectedCount = selectedClusterIds.length;
    const totalProjects = clusters
      .filter((c) => selectedClusterIds.includes(c.id))
      .reduce((sum, c) => sum + c._count.projects, 0);

    if (exportFormat === "json") {
      if (exportType === "detailed" && includeOptions.projects) {
        return totalProjects > 100
          ? "Large (>1MB)"
          : totalProjects > 20
            ? "Medium (~500KB)"
            : "Small (<100KB)";
      }
      return selectedCount > 50 ? "Medium (~200KB)" : "Small (<50KB)";
    } else {
      return exportType === "detailed" ? "Medium" : "Small";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Clusters
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Clusters</span>
          </DialogTitle>
          <DialogDescription>
            Export cluster data in various formats with customizable options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportFormat === "json"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setExportFormat("json")}
                >
                  <div className="flex items-center space-x-3">
                    <Database className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-medium">JSON Format</h3>
                      <p className="text-sm text-gray-500">
                        Complete data structure with relationships
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportFormat === "csv"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setExportFormat("csv")}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-medium">CSV Format</h3>
                      <p className="text-sm text-gray-500">
                        Spreadsheet-friendly tabular format
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportType === "summary"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setExportType("summary")}
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="font-medium">Summary Export</h3>
                      <p className="text-sm text-gray-500">
                        Cluster overview with basic statistics
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportType === "detailed"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setExportType("detailed")}
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="font-medium">Detailed Export</h3>
                      <p className="text-sm text-gray-500">
                        Complete data including all projects
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Include Options */}
          {exportFormat === "json" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Include Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeProjects"
                      checked={includeOptions.projects}
                      onCheckedChange={(checked) =>
                        setIncludeOptions({
                          ...includeOptions,
                          projects: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="includeProjects">Project details</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeStatistics"
                      checked={includeOptions.statistics}
                      onCheckedChange={(checked) =>
                        setIncludeOptions({
                          ...includeOptions,
                          statistics: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="includeStatistics">Statistics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMetadata"
                      checked={includeOptions.metadata}
                      onCheckedChange={(checked) =>
                        setIncludeOptions({
                          ...includeOptions,
                          metadata: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="includeMetadata">Metadata</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAnalytics"
                      checked={includeOptions.analytics}
                      onCheckedChange={(checked) =>
                        setIncludeOptions({
                          ...includeOptions,
                          analytics: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="includeAnalytics">Analytics</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cluster Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Select Clusters ({selectedClusterIds.length} selected)
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectedClusterIds.length === clusters.length}
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
                      selectedClusterIds.includes(cluster.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`cluster-${cluster.id}`}
                        checked={selectedClusterIds.includes(cluster.id)}
                        onCheckedChange={(checked) =>
                          handleClusterToggle(cluster.id, checked as boolean)
                        }
                      />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cluster.color || "#3B82F6" }}
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

          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Clusters to export:</span>
                  <span className="font-medium">
                    {selectedClusterIds.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Export format:</span>
                  <span className="font-medium">
                    {exportFormat.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Export type:</span>
                  <span className="font-medium">{exportType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated file size:</span>
                  <span className="font-medium">{getEstimatedFileSize()}</span>
                </div>
                {exportFormat === "json" && (
                  <div className="flex justify-between">
                    <span>Include options:</span>
                    <span className="font-medium">
                      {Object.entries(includeOptions)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => key)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isPending || selectedClusterIds.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isPending
                ? "Exporting..."
                : `Export ${selectedClusterIds.length} Cluster${selectedClusterIds.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
