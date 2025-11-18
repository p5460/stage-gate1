import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReviewForm } from "@/components/reviews/review-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { submitReview, saveDraftReview } from "@/actions/reviews";

interface ReviewPageProps {
  params: {
    id: string;
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Await params for Next.js 15 compatibility
  const { id } = await params;

  // Get the project and any existing review
  const project = await db.project.findUnique({
    where: { id },
    include: {
      lead: true,
      cluster: true,
      gateReviews: {
        where: {
          reviewerId: session.user.id!,
          stage: {
            // Get review for current stage
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
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

  // Check if user has permission to review this project
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  const canReview =
    user?.role === "ADMIN" ||
    user?.role === "GATEKEEPER" ||
    user?.role === "REVIEWER";

  if (!canReview) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to conduct reviews for this project.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const existingReview = project.gateReviews[0];

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/projects/${project.id}/review`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to Review Dashboard</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Review: {project.name}
          </h1>
          <p className="text-gray-600">{project.projectId}</p>
        </div>
      </div>

      {/* Review Form */}
      <ReviewForm
        project={{
          id: project.id,
          name: project.name,
          projectId: project.projectId,
          description: project.description || undefined,
          currentStage: project.currentStage,
          lead: {
            name: project.lead.name || "Unknown",
            email: project.lead.email || "",
          },
          cluster: {
            name: project.cluster.name,
          },
        }}
        review={
          existingReview
            ? {
                id: existingReview.id,
                stage: existingReview.stage,
                score: existingReview.score || undefined,
                comments: existingReview.comments || undefined,
                decision: existingReview.decision || undefined,
                isCompleted: existingReview.isCompleted,
              }
            : undefined
        }
        onSubmit={submitReview}
        onSaveDraft={saveDraftReview}
      />
    </div>
  );
}
