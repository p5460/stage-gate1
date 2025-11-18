"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Calendar,
  Star,
} from "lucide-react";

interface MultiReviewerStatusProps {
  session: any;
}

export function MultiReviewerStatus({ session }: MultiReviewerStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600";
      case "IN_PROGRESS":
        return "text-blue-600";
      case "ASSIGNED":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return CheckCircle;
      case "IN_PROGRESS":
        return Clock;
      case "ASSIGNED":
        return AlertCircle;
      default:
        return AlertCircle;
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

  const completionRate =
    (session.completedReviews / session.requiredReviewers) * 100;
  const completedReviews =
    session.gateReviews?.filter((r: any) => r.isCompleted) || [];
  const averageScore =
    completedReviews.length > 0
      ? completedReviews.reduce(
          (sum: number, r: any) => sum + (r.score || 0),
          0
        ) / completedReviews.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Review Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {session.completedReviews}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {session.requiredReviewers}
              </div>
              <div className="text-sm text-gray-600">Required</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(completionRate)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {averageScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">
                {session.completedReviews}/{session.requiredReviewers}
              </span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviewer Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Reviewer Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {session.reviewAssignments?.map((assignment: any) => {
              const review = session.gateReviews?.find(
                (r: any) => r.reviewerId === assignment.reviewerId
              );
              const StatusIcon = getStatusIcon(assignment.status);

              return (
                <Card key={assignment.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">
                            {assignment.reviewer.name}
                          </h4>
                          <Badge variant="outline">
                            {assignment.reviewer.role}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 mt-1">
                          {assignment.reviewer.email}
                        </div>

                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center space-x-2">
                            <StatusIcon
                              className={`h-4 w-4 ${getStatusColor(assignment.status)}`}
                            />
                            <span
                              className={`text-sm font-medium ${getStatusColor(assignment.status)}`}
                            >
                              {assignment.status}
                            </span>
                          </div>

                          <div className="text-sm text-gray-500">
                            Assigned:{" "}
                            {new Date(
                              assignment.assignedAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Details */}
                    <div className="text-right">
                      {review?.isCompleted ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">
                              {review.score}/5.0
                            </span>
                          </div>

                          {review.decision && (
                            <Badge
                              className={getDecisionColor(review.decision)}
                            >
                              {review.decision}
                            </Badge>
                          )}

                          <div className="text-xs text-gray-500">
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Pending Review
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Comments Preview */}
                  {review?.comments && (
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
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Session Summary */}
      {session.status === "COMPLETED" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Session Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Review Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Reviews:</span>
                    <span className="font-medium">
                      {completedReviews.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Score:</span>
                    <span className="font-medium">
                      {averageScore.toFixed(2)}/5.0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate:</span>
                    <span className="font-medium">
                      {Math.round(completionRate)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Decision Breakdown</h4>
                <div className="space-y-2">
                  {["GO", "RECYCLE", "HOLD", "STOP"].map((decision) => {
                    const count = completedReviews.filter(
                      (r: any) => r.decision === decision
                    ).length;
                    if (count === 0) return null;

                    return (
                      <div
                        key={decision}
                        className="flex items-center justify-between"
                      >
                        <Badge className={getDecisionColor(decision)}>
                          {decision}
                        </Badge>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {session.averageScore && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    All reviews completed! Average score:{" "}
                    {session.averageScore.toFixed(2)}/5.0
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  This session is ready for final approval by a gatekeeper or
                  administrator.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
