"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewerAssignmentForm } from "./reviewer-assignment-form";
import {
  ClipboardCheck,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
  FileText,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface IntegratedReviewDashboardProps {
  project: any;
  currentReviews: any[];
  availableReviewers: any[];
  currentUser: { id: string; role: string };
}

export function IntegratedReviewDashboard({
  project,
  currentReviews,
  availableReviewers,
  currentUser,
}: IntegratedReviewDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  const canManageReviewers =
    currentUser.role === "ADMIN" || currentUser.role === "GATEKEEPER";
  const isAssignedReviewer = currentReviews.some(
    (review) => review.reviewerId === currentUser.id
  );

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

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "GO":
        return "bg-green-100 text-green-800";
      case "RECYCLE":
        return "bg-yellow-100 text-yellow-800";
      case "HOLD":
        return "bg-blue-100 text-blue-800";
      case "STOP":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const completedReviews = currentReviews.filter(
    (review) => review.isCompleted
  );
  const completionRate =
    currentReviews.length > 0
      ? (completedReviews.length / currentReviews.length) * 100
      : 0;
  const averageScore =
    completedReviews.length > 0
      ? completedReviews.reduce((sum, r) => sum + (r.score || 0), 0) /
        completedReviews.length
      : 0;

  const handleApproveSession = async () => {
    if (completedReviews.length !== currentReviews.length) {
      toast.error("All reviews must be completed before approval");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to approve this review session? This will update the project status and may advance it to the next stage."
    );

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const sessionId = `${project.id}-${project.currentStage}`;
      const response = await fetch(`/api/review-sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Review session approved successfully");
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to approve review session");
      }
    } catch (error) {
      toast.error("Failed to approve review session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Reviewers
                </p>
                <p className="text-2xl font-bold">{currentReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(completionRate)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Review Progress</h3>
              <span className="text-sm text-gray-600">
                {completedReviews.length}/{currentReviews.length} completed
              </span>
            </div>
            <Progress value={completionRate} className="h-3" />

            {completionRate === 100 && canManageReviewers && (
              <div className="flex justify-end">
                <Button onClick={handleApproveSession} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Session
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
          {canManageReviewers && (
            <TabsTrigger value="assign">Assign More</TabsTrigger>
          )}
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Current Stage</h4>
                  <Badge className={getStageColor(project.currentStage)}>
                    {formatStage(project.currentStage)}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Status:{" "}
                    <span className="font-medium">{project.status}</span>
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Review Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Completion Rate:</span>
                      <span className="font-medium">
                        {Math.round(completionRate)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Score:</span>
                      <span className="font-medium">
                        {averageScore.toFixed(2)}/5.0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Reviews:</span>
                      <span className="font-medium">
                        {currentReviews.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviewers" className="space-y-4">
          {currentReviews.length > 0 ? (
            <div className="space-y-4">
              {currentReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {review.reviewer.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {review.reviewer.email}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Assigned:{" "}
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {review.isCompleted ? (
                          <>
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="font-medium">
                                  {review.score}/5.0
                                </span>
                              </div>
                              {review.decision && (
                                <Badge
                                  className={getDecisionColor(review.decision)}
                                  variant="outline"
                                >
                                  {review.decision}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-green-600">
                              Completed
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    {review.comments && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Comments
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {review.comments.length > 150
                            ? `${review.comments.substring(0, 150)}...`
                            : review.comments}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reviewers assigned</p>
                <p className="text-sm text-gray-400">
                  Assign reviewers to start the review process
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {canManageReviewers && (
          <TabsContent value="assign">
            <ReviewerAssignmentForm
              project={project}
              availableReviewers={availableReviewers}
              currentReviewers={currentReviews.map((r) => r.reviewer)}
            />
          </TabsContent>
        )}

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAssignedReviewer && (
                <Button className="w-full" asChild>
                  <Link href={`/reviews/${project.id}`}>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Conduct My Review
                  </Link>
                </Button>
              )}

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/projects/${project.id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Project Details
                </Link>
              </Button>

              {canManageReviewers && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("assign")}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign More Reviewers
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
