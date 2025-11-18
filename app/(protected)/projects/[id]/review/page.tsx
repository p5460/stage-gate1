import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { IntegratedReviewDashboard } from "@/components/reviews/integrated-review-dashboard";
import Link from "next/link";

interface ProjectReviewPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectReviewPage({
  params,
}: ProjectReviewPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Await params for Next.js 15 compatibility
  const { id } = await params;

  // Get the project
  const project = await db.project.findUnique({
    where: { id },
    include: {
      lead: true,
      cluster: true,
      gateReviews: {
        where: {
          stage: {
            // Get reviews for current stage
          },
        },
        include: {
          reviewer: true,
        },
        orderBy: { createdAt: "desc" },
      },
      documents: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-gray-600">
              The project you're looking for doesn't exist or you don't have
              access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has permission to access this review
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  const canAccessReview =
    user?.role === "ADMIN" ||
    user?.role === "GATEKEEPER" ||
    user?.role === "REVIEWER" ||
    project.leadId === session.user.id;

  if (!canAccessReview) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access the review dashboard for this
              project.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get reviews for current stage
  const currentStageReviews = project.gateReviews.filter(
    (review: any) => review.stage === project.currentStage
  );

  // Get available reviewers
  const availableReviewers = await db.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "GATEKEEPER", "REVIEWER"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Back to Project</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Project Review Dashboard
                </h1>
                <div className="text-gray-600">
                  {project.name} ({project.projectId})
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Lead: {project.lead.name} • Cluster: {project.cluster.name}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrated Dashboard */}
      <IntegratedReviewDashboard
        project={project}
        currentReviews={currentStageReviews}
        availableReviewers={availableReviewers}
        currentUser={{
          id: session.user.id!,
          role: user?.role || "USER",
        }}
      />
    </div>
  );
}
