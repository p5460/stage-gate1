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
  MoreHorizontal,
  Download,
  Trash2,
  Flag,
  Archive,
  Play,
  Pause,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteProject,
  updateProject,
  exportProject,
} from "@/actions/projects";
import { EditProjectForm } from "./edit-project-form";
import { ExportProjects } from "./export-projects";

interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  businessCase: string | null;
  currentStage: string;
  status: string;
  budget: number | null;
  budgetUtilization: number | null;
  duration: number | null;
  technologyReadiness: string | null;
  ipPotential: string | null;
  startDate: Date | null;
  endDate: Date | null;
  clusterId: string;
  leadId: string;
  lead: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    department: string | null;
    position: string | null;
  };
  cluster: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
  };
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
      department: string | null;
      position: string | null;
    };
  }>;
  documents: Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    mimeType: string | null;
    version: number;
    isRequired: boolean;
    isApproved: boolean;
    createdAt: Date;
    uploader: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }>;
  milestones: Array<{
    id: string;
    title: string;
    dueDate: Date;
  }>;
  redFlags: Array<{
    id: string;
    title: string;
    severity: string;
  }>;
  _count?: {
    documents: number;
    redFlags: number;
    members: number;
  };
}

interface Cluster {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface ProjectManagementProps {
  project: Project;
  clusters: Cluster[];
  users: User[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate?: () => void;
}

export function ProjectManagement({
  project,
  clusters,
  users,
  currentUserId,
  currentUserRole,
  onUpdate,
}: ProjectManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check permissions
  const isAdmin = currentUserRole === "ADMIN";
  const isGatekeeper = currentUserRole === "GATEKEEPER";
  const isProjectLead = project.lead.id === currentUserId;
  const isTeamMember = project.members?.some(
    (member) => member.user.id === currentUserId
  );

  const canEdit = isAdmin || isGatekeeper || isProjectLead;
  const canDelete = isAdmin || isProjectLead;
  const canExport = isAdmin || isGatekeeper || isProjectLead || isTeamMember;

  const canManageStatus = isAdmin || isGatekeeper || isProjectLead;

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      try {
        const result = await updateProject(project.id, { status: newStatus });
        if (result.success) {
          toast.success(
            `Project status updated to ${newStatus.replace("_", " ")}`
          );
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to update project status");
        }
      } catch (error) {
        toast.error("An error occurred while updating project status");
      }
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        const result = await exportProject(project.id, "json");
        if (result.success) {
          // Create and download file
          const blob = new Blob([result.data], {
            type: result.mimeType || "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = result.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success("Project exported successfully");
        } else {
          toast.error(result.error || "Failed to export project");
        }
      } catch (error) {
        toast.error("An error occurred while exporting project");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteProject(project.id);
        if (result.success) {
          toast.success("Project deleted successfully");
          setShowDeleteDialog(false);
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to delete project");
        }
      } catch (error) {
        toast.error("An error occurred while deleting project");
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Play className="h-4 w-4" />;
      case "PENDING_REVIEW":
        return <Pause className="h-4 w-4" />;
      case "ON_HOLD":
        return <Pause className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "TERMINATED":
        return <Archive className="h-4 w-4" />;
      case "RED_FLAG":
        return <Flag className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-600";
      case "PENDING_REVIEW":
        return "text-yellow-600";
      case "ON_HOLD":
        return "text-blue-600";
      case "COMPLETED":
        return "text-purple-600";
      case "TERMINATED":
        return "text-gray-600";
      case "RED_FLAG":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Edit Project */}
          {canEdit && (
            <DropdownMenuItem asChild>
              <EditProjectForm
                project={project as any}
                clusters={clusters as any}
                users={users as any}
                currentUser={
                  { id: currentUserId, role: currentUserRole } as any
                }
              />
            </DropdownMenuItem>
          )}

          {/* Export Project */}
          {canExport && (
            <DropdownMenuItem asChild>
              <ExportProjects projects={[project]} singleProject={project} />
            </DropdownMenuItem>
          )}

          {/* Quick Export */}
          {canExport && (
            <DropdownMenuItem onClick={handleExport} disabled={isPending}>
              <Download className="h-4 w-4 mr-2" />
              Quick Export (JSON)
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Status Management */}
          {canManageStatus && (
            <>
              <DropdownMenuItem
                onClick={() => handleStatusChange("ACTIVE")}
                disabled={isPending || project.status === "ACTIVE"}
                className={project.status === "ACTIVE" ? "opacity-50" : ""}
              >
                <div
                  className={`flex items-center ${getStatusColor("ACTIVE")}`}
                >
                  {getStatusIcon("ACTIVE")}
                  <span className="ml-2">Set Active</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleStatusChange("ON_HOLD")}
                disabled={isPending || project.status === "ON_HOLD"}
                className={project.status === "ON_HOLD" ? "opacity-50" : ""}
              >
                <div
                  className={`flex items-center ${getStatusColor("ON_HOLD")}`}
                >
                  {getStatusIcon("ON_HOLD")}
                  <span className="ml-2">Put On Hold</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleStatusChange("COMPLETED")}
                disabled={isPending || project.status === "COMPLETED"}
                className={project.status === "COMPLETED" ? "opacity-50" : ""}
              >
                <div
                  className={`flex items-center ${getStatusColor("COMPLETED")}`}
                >
                  {getStatusIcon("COMPLETED")}
                  <span className="ml-2">Mark Complete</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuSeparator />

          {/* Delete Project */}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              disabled={isPending}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action
              cannot be undone and will permanently remove all project data,
              including documents, comments, and activity history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
