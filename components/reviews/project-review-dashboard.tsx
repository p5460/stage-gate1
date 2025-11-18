"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
// import { ReviewerAssignment } from "./reviewer-assignment";
// import { MultiReviewerStatus } from "./multi-reviewer-status";
import { ReviewForm } from "./review-form";
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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ProjectReviewDashboardProps {
  project: {
    id: string;
    name: string;
    projectId: string;
    description?: string;
    currentStage: string;
    status: string;
    lead: { id: string; name: string; email: string };
    cluster: { name: string };
  };
  currentSession?: any;
  availableReviewers: any[];
  currentUser: { id: string; role: string };
}

export function ProjectReviewDashboard({
  project,
  currentSession: initialSession,
  availableReviewers,
  currentUser,
}: ProjectReviewDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentSession, setCurrentSession] = useState(initialSession);
  const [isLoading, setIsLoading] = useState(false);

  const canManageReviewers =
    currentUser.role === "ADMIN" || currentUser.role === "GATEKEEPER";
  const isAssignedReviewer = currentSession?.reviewAssignments?.some(
    (assignment: any) => assignment.reviewerId === currentUser.id
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

  const getSessionStatus = () => {
    if (!currentSession)
      return {
        status: "No Review Session",
        color: "text-gray-600",
        icon: AlertCircle,
      };

    switch (currentSession.status) {
      case "PENDING":
        return {
          status: "Pending Reviews",
          color: "text-yellow-600",
          icon: Clock,
        };
      case "IN_PROGRESS":
        return { status: "In Progress", color: "text-blue-600", icon: Clock };
      case "COMPLETED":
        return {
          status: "Completed",
          color: "text-green-600",
          icon: CheckCircle,
        };
      case "APPROVED":
        return {
          status: "Approved",
          color: "text-green-600",
          icon: CheckCircle,
        };
      default:
        return {
          status: currentSession.status,
          color: "text-gray-600",
          icon: AlertCircle,
        };
    }
  };

  const handleCreateReviewSession = async (
    reviewerIds: string[],
    dueDate?: Date
  ) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/review-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          stage: project.currentStage,
          reviewerIds,
          dueDate: dueDate?.toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Reviewers assigned successfully");
        // Refresh the page data
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to assign reviewers");
      }
    } catch (error) {
      toast.error("Failed to create review session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSession = async () => {
    if (!currentSession) return;

    const confirmed = window.confirm(
      "Are you sure you want to approve this review session? This will update the project status and may advance it to the next stage."
    );

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/review-sessions/${currentSession.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
          }),
        }
      );

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

  const sessionStatusInfo = getSessionStatus();
  const StatusIcon = sessionStatusInfo.icon;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-3">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">
                  Project Review Dashboard
                </CardTitle>
                <Badge className={getStageColor(project.currentStage)}>
                  {formatStage(project.currentStage)}
                </Badge>
              </div>
              <div className="text-gray-600">
                {project.name} ({project.projectId})
              </div>

              {/* Session Status */}
              <div className="flex items-center space-x-2">
                <StatusIcon className={`h-5 w-5 ${sessionStatusInfo.color}`} />
                <span className={`font-medium ${sessionStatusInfo.color}`}>
                  {sessionStatusInfo.status}
                </span>
                {currentSession && (
                  <Badge variant="outline">
                    {currentSession.completedReviews}/
                    {currentSession.requiredReviewers} Reviews Complete
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {canManageReviewers && currentSession?.status === "COMPLETED" && (
                <Button onClick={handleApproveSession} disabled={isLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Session
                </Button>
              )}
              {canManageReviewers && !currentSession && (
                <Button onClick={() => setActiveTab("assign")}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Reviewers
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      {/* Project Information */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Project Lead</div>
                <div className="font-medium">{project.lead.name}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Cluster</div>
                <div className="font-medium">{project.cluster.name}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-medium">{project.status}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Current Stage</div>
                <div className="font-medium">
                  {formatStage(project.currentStage)}
                </div>
              </div>
            </div>
          </div>

          {project.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">
                Project Description
              </div>
              <div className="text-sm">{project.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">Review Status</TabsTrigger>
          {canManageReviewers && (
            <TabsTrigger value="assign">Assign Reviewers</TabsTrigger>
          )}
          {isAssignedReviewer && (
            <TabsTrigger value="conduct">Conduct Review</TabsTrigger>
          )}
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Review Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Review Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {currentSession ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Completion Rate
                      </span>
                      <span className="text-sm text-gray-600">
                        {currentSession.completedReviews}/
                        {currentSession.requiredReviewers}
                      </span>
                    </div>
                    <Progress
                      value={
                        (currentSession.completedReviews /
                          currentSession.requiredReviewers) *
                        100
                      }
                      className="h-2"
                    />
                    {currentSession.averageScore && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Average Score
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {currentSession.averageScore.toFixed(2)}/5.0
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No active review session</p>
                    <p className="text-sm">
                      Assign reviewers to start the review process
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Review Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Required Reviewers</span>
                    <Badge variant="outline">
                      {currentSession?.requiredReviewers || "Not Set"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Review Stage</span>
                    <Badge className={getStageColor(project.currentStage)}>
                      {formatStage(project.currentStage)}
                    </Badge>
                  </div>
                  {currentSession?.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Due Date</span>
                      <span className="text-sm text-gray-600">
                        {new Date(currentSession.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Session Status</span>
                    <Badge
                      variant="outline"
                      className={sessionStatusInfo.color}
                    >
                      {sessionStatusInfo.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status">
          {currentSession ? (
            <div>Multi-Reviewer Status Component</div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active review session</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {canManageReviewers && (
          <TabsContent value="assign">
            <div>Reviewer Assignment Component</div>
          </TabsContent>
        )}

        {isAssignedReviewer && (
          <TabsContent value="conduct">
            <ReviewForm
              project={project}
              review={currentSession?.gateReviews?.find(
                (r: any) => r.reviewerId === currentUser.id
              )}
              onSubmit={async (reviewData) => {
                // Submit individual review
                const response = await fetch("/api/reviews", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...reviewData,
                    sessionId: currentSession?.id,
                  }),
                });

                if (response.ok) {
                  toast.success("Review submitted successfully");
                  window.location.reload();
                } else {
                  throw new Error("Failed to submit review");
                }
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Review History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Review history will be displayed here</p>
                <p className="text-sm">
                  Track all previous review sessions and decisions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
