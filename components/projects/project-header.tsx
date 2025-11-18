"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, AlertTriangle, ClipboardCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Edit } from "lucide-react";
import { CreateReviewForm } from "./create-review-form";
import { ExportProjects } from "./export-projects";

interface ProjectHeaderProps {
  project: any;
  clusters?: Array<{ id: string; name: string }>;
  users?: Array<{ id: string; name: string; email: string }>;
  reviewers?: Array<{ id: string; name: string; email: string }>;
  currentUser?: {
    id: string;
    role: string;
  };
}

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PENDING_REVIEW":
      return "bg-yellow-100 text-yellow-800";
    case "ON_HOLD":
      return "bg-gray-100 text-gray-800";
    case "RED_FLAG":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStage = (stage: string) => {
  switch (stage) {
    case "STAGE_0":
      return "Stage 0: Concept";
    case "STAGE_1":
      return "Stage 1: Research Planning";
    case "STAGE_2":
      return "Stage 2: Feasibility";
    case "STAGE_3":
      return "Stage 3: Maturation";
    default:
      return stage;
  }
};

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export function ProjectHeader({
  project,
  clusters = [],
  users = [],
  reviewers = [],
  currentUser,
}: ProjectHeaderProps) {
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check if current user can delete this project
  const canDelete =
    currentUser &&
    (currentUser.role === "ADMIN" ||
      (currentUser.role === "PROJECT_LEAD" &&
        project.leadId === currentUser.id));

  // Check if current user can review projects
  const canReview =
    currentUser &&
    (currentUser.role === "ADMIN" ||
      currentUser.role === "GATEKEEPER" ||
      currentUser.role === "REVIEWER" ||
      (currentUser.role === "PROJECT_LEAD" &&
        project.leadId === currentUser.id));

  // Check if current user can edit this project
  const canEdit =
    currentUser &&
    (currentUser.role === "ADMIN" ||
      currentUser.role === "GATEKEEPER" ||
      (currentUser.role === "PROJECT_LEAD" &&
        project.leadId === currentUser.id));

  const handleSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(`Project "${project.name}" deleted successfully`);
        // Redirect to projects page after successful deletion
        router.push("/projects");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(
        `Failed to delete project: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setDeleteLoading(false);
    }
  };
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to Projects</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project._count?.redFlags && project._count.redFlags > 0 && (
              <AlertTriangle className="h-6 w-6 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{project.projectId}</span>
            <Badge className={getStageColor(project.currentStage)}>
              {formatStage(project.currentStage)}
            </Badge>
            <Badge className={getStatusColor(project.status)}>
              {formatStatus(project.status)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canReview && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/projects/${project.id}/review`}>
                  <Button variant="outline" size="sm">
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Review Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {canReview && (
          <CreateReviewForm
            projectId={project.id}
            reviewers={reviewers}
            onSuccess={handleSuccess}
          />
        )}
        {canEdit && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/projects/${project.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <ExportProjects
          projects={[]}
          singleProject={{
            id: project.id,
            projectId: project.projectId,
            name: project.name,
            status: project.status,
            currentStage: project.currentStage,
            lead: {
              name: project.lead?.name || null,
            },
            cluster: {
              name: project.cluster?.name || "",
            },
          }}
        />
        {canDelete && (
          <TooltipProvider>
            <Tooltip>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{project.name}"? This
                      action cannot be undone and will permanently remove:
                    </AlertDialogDescription>
                    <div className="mt-2">
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>All project documents and files</li>
                        <li>Gate reviews and feedback</li>
                        <li>Team member assignments</li>
                        <li>Red flags and comments</li>
                        <li>Project history and activities</li>
                      </ul>
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? "Deleting..." : "Delete Project"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <TooltipContent>
                <p>{deleteLoading ? "Deleting..." : "Delete Project"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
