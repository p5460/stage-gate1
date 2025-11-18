"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Database,
  CheckCircle,
  FileImage,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";
import { exportProject, exportMultipleProjects } from "@/actions/projects";

interface Project {
  id: string;
  projectId: string;
  name: string;
  status: string;
  currentStage: string;
  lead: {
    name: string | null;
  };
  cluster: {
    name: string;
  };
}

interface ExportProjectsProps {
  projects: Project[];
  selectedProjects?: string[];
  singleProject?: Project;
}

export function ExportProjects({
  projects,
  selectedProjects = [],
  singleProject,
}: ExportProjectsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [exportFormat, setExportFormat] = useState<
    "json" | "csv" | "pdf" | "pptx"
  >("json");
  const [includeDetails, setIncludeDetails] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    singleProject ? [singleProject.id] : selectedProjects
  );

  const handleExport = () => {
    if (selectedProjectIds.length === 0) {
      toast.error("Please select at least one project to export");
      return;
    }

    startTransition(async () => {
      try {
        let result;

        if (selectedProjectIds.length === 1 && singleProject) {
          // Single project export with full details
          result = await exportProject(selectedProjectIds[0], exportFormat);
        } else {
          // Multiple projects export
          result = await exportMultipleProjects(
            selectedProjectIds,
            exportFormat
          );
        }

        if (result.success) {
          // Create and download file
          const mimeTypes = {
            json: "application/json",
            csv: "text/csv",
            pdf: "text/plain", // Currently returning text format for PDF
            pptx: "application/json", // Currently returning JSON structure for PowerPoint
          };

          const blob = new Blob([result.data], {
            type: result.mimeType || mimeTypes[exportFormat],
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success(
            `${selectedProjectIds.length} project${selectedProjectIds.length > 1 ? "s" : ""} exported successfully`
          );
          setIsOpen(false);
        } else {
          toast.error(result.error || "Failed to export projects");
        }
      } catch (error) {
        console.error("Export error:", error);
        toast.error("An error occurred while exporting projects");
      }
    });
  };

  const handleProjectToggle = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjectIds([...selectedProjectIds, projectId]);
    } else {
      setSelectedProjectIds(
        selectedProjectIds.filter((id) => id !== projectId)
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjectIds(projects.map((p) => p.id));
    } else {
      setSelectedProjectIds([]);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export{" "}
          {singleProject
            ? "Project"
            : `Projects${selectedProjects.length > 0 ? ` (${selectedProjects.length})` : ""}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Projects</span>
          </DialogTitle>
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
                        Complete data structure with all relationships
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
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportFormat === "pdf"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setExportFormat("pdf")}
                >
                  <div className="flex items-center space-x-3">
                    <FileImage className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="font-medium">PDF Report</h3>
                      <p className="text-sm text-gray-500">
                        Professional document format for sharing
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportFormat === "pptx"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setExportFormat("pptx")}
                >
                  <div className="flex items-center space-x-3">
                    <Presentation className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="font-medium">PowerPoint</h3>
                      <p className="text-sm text-gray-500">
                        Presentation format for meetings and reviews
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {!singleProject && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDetails"
                      checked={includeDetails}
                      onCheckedChange={(checked) =>
                        setIncludeDetails(checked as boolean)
                      }
                    />
                    <Label htmlFor="includeDetails">
                      Include detailed project information (documents, gate
                      reviews, red flags, etc.)
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Note: Detailed exports may take longer and result in larger
                    files
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Selection */}
          {!singleProject && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>
                    Select Projects ({selectedProjectIds.length} selected)
                  </span>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedProjectIds.length === projects.length}
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked as boolean)
                      }
                    />
                    <Label htmlFor="selectAll" className="text-sm">
                      Select All
                    </Label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        selectedProjectIds.includes(project.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`project-${project.id}`}
                          checked={selectedProjectIds.includes(project.id)}
                          onCheckedChange={(checked) =>
                            handleProjectToggle(project.id, checked as boolean)
                          }
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
                            <Badge
                              className={getStageColor(project.currentStage)}
                            >
                              {project.currentStage.replace("STAGE_", "Stage ")}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Lead: {project.lead.name} • {project.cluster.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Single Project Info */}
          {singleProject && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project to Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">{singleProject.name}</h4>
                    <Badge variant="outline">{singleProject.projectId}</Badge>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(singleProject.status)}>
                      {singleProject.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      className={getStageColor(singleProject.currentStage)}
                    >
                      {singleProject.currentStage.replace("STAGE_", "Stage ")}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Lead: {singleProject.lead.name} •{" "}
                      {singleProject.cluster.name}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Single project exports include complete details: team members,
                  gate reviews, documents, red flags, milestones, and activity
                  history.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Projects to export:</span>
                  <span className="font-medium">
                    {selectedProjectIds.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Export format:</span>
                  <span className="font-medium">
                    {exportFormat.toUpperCase()}
                  </span>
                </div>
                {!singleProject && (
                  <div className="flex justify-between">
                    <span>Include details:</span>
                    <span className="font-medium">
                      {includeDetails ? "Yes" : "No"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated file size:</span>
                  <span className="font-medium">
                    {singleProject || includeDetails ? "Large" : "Small"}
                  </span>
                </div>
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
              disabled={isPending || selectedProjectIds.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isPending
                ? "Exporting..."
                : `Export ${selectedProjectIds.length} Project${selectedProjectIds.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
