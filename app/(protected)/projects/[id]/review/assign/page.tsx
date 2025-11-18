import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReviewerAssignmentForm } from "@/components/reviews/reviewer-assignment-form";
import { AnyARecord } from "dns";

interface AssignReviewersPageProps {
  params: {
    id: string;
  };
}

export default async function AssignReviewersPage({
  params,
}: AssignReviewersPageProps) {
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permissions
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  const canManageReviewers =
    user?.role === "ADMIN" || user?.role === "GATEKEEPER";

  if (!canManageReviewers) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to assign reviewers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const currentStageReviews = project.gateReviews.filter(
    (review: any) => review.stage === project.currentStage
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <UserPlus className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">Assign Reviewers</CardTitle>
              </div>
              <div className="text-gray-600">
                {project.name} - {formatStage(project.currentStage)}
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/projects/${project.id}/review`}>
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back to Review Dashboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
      </Card>

      {/* Current Reviewers */}
      {currentStageReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Reviewers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStageReviews.map((review: any) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{review.reviewer.name}</div>
                    <div className="text-sm text-gray-600">
                      {review.reviewer.email}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      review.isCompleted ? "text-green-600" : "text-yellow-600"
                    }
                  >
                    {review.isCompleted ? "Completed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Form */}
      <ReviewerAssignmentForm
        project={project}
        availableReviewers={availableReviewers}
        currentReviewers={currentStageReviews.map((r: any) => r.reviewer)}
      />
    </div>
  );
}
