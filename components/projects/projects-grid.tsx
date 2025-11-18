"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  currentStage: string;
  status: string;
  lead: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  cluster: {
    name: string;
  };
  _count: {
    documents: number;
    redFlags: number;
    members: number;
  };
}

interface ProjectsGridProps {
  projects: Project[];
  onProjectUpdate?: () => void;
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case "STAGE_0":
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800";
    case "STAGE_1":
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800";
    case "STAGE_2":
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800";
    case "STAGE_3":
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800";
    default:
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800";
    case "PENDING_REVIEW":
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800";
    case "ON_HOLD":
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
    case "RED_FLAG":
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
    default:
      return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800";
  }
};

const formatStage = (stage: string) => {
  switch (stage) {
    case "STAGE_0":
      return "Stage 0";
    case "STAGE_1":
      return "Stage 1";
    case "STAGE_2":
      return "Stage 2";
    case "STAGE_3":
      return "Stage 3";
    default:
      return stage;
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PENDING_REVIEW":
      return "Review";
    case "ON_HOLD":
      return "On Hold";
    case "RED_FLAG":
      return "Red Flag";
    default:
      return status;
  }
};

const getProjectInitials = (name: string) => {
  const words = name.split(" ");
  if (words.length >= 2) {
    return words[0].charAt(0) + words[1].charAt(0);
  }
  return name.substring(0, 2);
};

const getProjectColor = (index: number) => {
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-green-100 text-green-600",
    "bg-yellow-100 text-yellow-600",
    "bg-red-100 text-red-600",
    "bg-indigo-100 text-indigo-600",
  ];
  return colors[index % colors.length];
};

export function ProjectsGrid({ projects, onProjectUpdate }: ProjectsGridProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleProjectAction = async (
    action: string,
    projectId: string,
    project: Project
  ) => {
    setActionLoading(projectId);
    try {
      switch (action) {
        case "edit":
          // Navigate to edit page
          router.push(`/projects/${projectId}/edit`);
          break;

        case "duplicate":
          // Duplicate project via API
          const duplicateResponse = await fetch("/api/projects/duplicate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });

          if (duplicateResponse.ok) {
            const duplicatedProject = await duplicateResponse.json();
            toast.success(`Project "${project.name}" duplicated successfully`);
            onProjectUpdate?.();
          } else {
            throw new Error("Failed to duplicate project");
          }
          break;

        case "archive":
          // Archive project via API
          const archiveResponse = await fetch(`/api/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "ARCHIVED" }),
          });

          if (archiveResponse.ok) {
            toast.success(`Project "${project.name}" archived successfully`);
            onProjectUpdate?.();
          } else {
            throw new Error("Failed to archive project");
          }
          break;

        case "delete":
          // Delete project with confirmation
          if (
            confirm(
              `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
            )
          ) {
            const deleteResponse = await fetch(`/api/projects/${projectId}`, {
              method: "DELETE",
            });

            if (deleteResponse.ok) {
              toast.success(`Project "${project.name}" deleted successfully`);
              onProjectUpdate?.();
            } else {
              throw new Error("Failed to delete project");
            }
          }
          break;

        case "export-json":
          // Export project data as JSON
          const exportResponse = await fetch(
            `/api/projects/${projectId}/export?format=json`
          );

          if (exportResponse.ok) {
            const blob = await exportResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${project.name.replace(/\s+/g, "_")}_export.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(
              `Project "${project.name}" exported as JSON successfully`
            );
          } else {
            throw new Error("Failed to export project as JSON");
          }
          break;

        case "export-csv":
          // Export project data as CSV
          const csvResponse = await fetch(
            `/api/projects/${projectId}/export?format=csv`
          );

          if (csvResponse.ok) {
            const blob = await csvResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${project.name.replace(/\s+/g, "_")}_export.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(
              `Project "${project.name}" exported as CSV successfully`
            );
          } else {
            throw new Error("Failed to export project as CSV");
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Action failed:", error);
      toast.error(
        `Failed to ${action} project: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Default projects if none provided
  const defaultProjects = [
    {
      id: "1",
      projectId: "#STP-5678",
      name: "Smart Water Meter",
      description: "IoT-based water monitoring system for urban areas",
      currentStage: "STAGE_1",
      status: "ACTIVE",
      lead: { name: "Dr. Sarah Johnson", email: null, image: null },
      cluster: { name: "Smart Places" },
      _count: { documents: 5, redFlags: 0, members: 6 },
    },
    {
      id: "2",
      projectId: "#STP-3456",
      name: "Urban Traffic AI",
      description: "AI-powered traffic flow optimization",
      currentStage: "STAGE_2",
      status: "PENDING_REVIEW",
      lead: { name: "Dr. John Smith", email: null, image: null },
      cluster: { name: "Smart Places" },
      _count: { documents: 8, redFlags: 0, members: 4 },
    },
    {
      id: "3",
      projectId: "#STP-7890",
      name: "Waste Mgmt Sensors",
      description: "Smart sensors for optimized waste collection",
      currentStage: "STAGE_0",
      status: "ON_HOLD",
      lead: { name: "Dr. Linda Williams", email: null, image: null },
      cluster: { name: "Smart Places" },
      _count: { documents: 3, redFlags: 1, members: 3 },
    },
  ];

  const displayProjects = projects.length > 0 ? projects : defaultProjects;

  if (displayProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No projects found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayProjects.map((project, index) => (
        <div
          key={project.id}
          className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-300"
        >
          <div className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className={getStageColor(project.currentStage)}>
                  {formatStage(project.currentStage)}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">
                  {project.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {project.description || "No description available"}
                </p>
              </div>
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getProjectColor(index)}`}
              >
                <span className="font-medium">
                  {getProjectInitials(project.name)}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.lead.image || undefined} />
                    <AvatarFallback>
                      {project.lead.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-900">
                    {project.lead.name || project.lead.email}
                  </p>
                  <p className="text-xs text-gray-500">Lead Researcher</p>
                </div>
              </div>
              <span className={getStatusColor(project.status)}>
                {formatStatus(project.status)}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-2">
            <Link href={`/projects/${project.id}`}>
              <Button
                size="sm"
                className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm"
              >
                <i className="fas fa-eye mr-1"></i> View
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm"
                  disabled={actionLoading === project.id}
                >
                  {actionLoading === project.id ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-ellipsis-h"></i>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() =>
                    handleProjectAction("edit", project.id, project)
                  }
                  className="cursor-pointer"
                >
                  <i className="fas fa-edit mr-2 w-4"></i>
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleProjectAction("duplicate", project.id, project)
                  }
                  className="cursor-pointer"
                >
                  <i className="fas fa-copy mr-2 w-4"></i>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <i className="fas fa-download mr-2 w-4"></i>
                    Export Data
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() =>
                        handleProjectAction("export-json", project.id, project)
                      }
                      className="cursor-pointer"
                    >
                      <i className="fas fa-file-code mr-2 w-4"></i>
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleProjectAction("export-csv", project.id, project)
                      }
                      className="cursor-pointer"
                    >
                      <i className="fas fa-file-csv mr-2 w-4"></i>
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    handleProjectAction("archive", project.id, project)
                  }
                  className="cursor-pointer"
                >
                  <i className="fas fa-archive mr-2 w-4"></i>
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleProjectAction("delete", project.id, project)
                  }
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <i className="fas fa-trash mr-2 w-4"></i>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
