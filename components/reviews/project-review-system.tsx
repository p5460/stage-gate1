"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MessageSquare,
  Calendar,
  User,
  FileText,
  Send,
  Eye,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  currentStage: string;
  status: string;
  lead: {
    id: string;
    name: string | null;
    email: string | null;
  };
  cluster: {
    name: string;
  };
}

interface GateReview {
  id: string;
  projectId: string;
  stage: string;
  reviewerId: string;
  decision?: string | null;
  score?: number | null;
  comments?: string | null;
  reviewDate?: Date | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  project: Project;
  reviewer: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface ProjectReviewSystemProps {
  pendingReviews: GateReview[];
  completedReviews: GateReview[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate?: () => void;
}

export function ProjectReviewSystem({
  pendingReviews,
  completedReviews,
  currentUserId,
  currentUserRole,
  onUpdate,
}: ProjectReviewSystemProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedReview, setSelectedReview] = useState<GateReview | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    decision: "",
    score: 0,
    comments: "",
  });

  // Mock data for demonstration
  const mockPendingReviews: GateReview[] = [
    {
      id: "review-1",
      projectId: "proj-1",
      stage: "STAGE_2",
      reviewerId: currentUserId,
      decision: null,
      score: null,
      comments: null,
      reviewDate: null,
      isCompleted: false,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      project: {
        id: "proj-1",
        projectId: "STP-0001",
        name: "AI Research Project",
        description: "Advanced AI algorithms for industrial applications",
        currentStage: "STAGE_2",
        status: "PENDING_REVIEW",
        lead: {
          id: "user-1",
          name: "Dr. Sarah Johnson",
          email: "sarah.johnson@company.com",
        },
        cluster: {
          name: "Artificial Intelligence",
        },
      },
      reviewer: {
        id: currentUserId,
        name: "Current User",
        email: "current@company.com",
      },
    },
  ];

  const allPendingReviews =
    pendingReviews.length > 0 ? pendingReviews : mockPendingReviews;
  const handleSubmitReview = () => {
    if (!selectedReview || !reviewForm.decision) {
      toast.error("Please select a decision");
      return;
    }

    startTransition(async () => {
      try {
        // In a real app, this would call the server action
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("Review submitted successfully");
        setShowReviewDialog(false);
        setSelectedReview(null);
        setReviewForm({ decision: "", score: 0, comments: "" });
        onUpdate?.();
      } catch (error) {
        toast.error("Failed to submit review");
      }
    });
  };

  const openReviewDialog = (review: GateReview) => {
    setSelectedReview(review);
    setReviewForm({
      decision: review.decision || "",
      score: review.score || 0,
      comments: review.comments || "",
    });
    setShowReviewDialog(true);
  };

  const getDecisionColor = (decision: string | null | undefined) => {
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

  const isOverdue = (createdAt: Date) => {
    const daysDiff = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff > 7; // Consider overdue after 7 days
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Project Reviews</h2>
          <p className="text-gray-600">
            Review and approve project gate submissions
          </p>
        </div>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Review Guidelines
        </Button>
      </div>{" "}
      {/*
       * Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold">{allPendingReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">
                  {
                    allPendingReviews.filter((r) => isOverdue(r.createdAt))
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">
                  {completedReviews.length > 0
                    ? Math.round(
                        completedReviews.reduce(
                          (sum, r) => sum + (r.score || 0),
                          0
                        ) / completedReviews.length
                      )
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="completed">Completed Reviews</TabsTrigger>
          <TabsTrigger value="my-reviews">My Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {allPendingReviews.length > 0 ? (
            <div className="space-y-4">
              {allPendingReviews.map((review) => (
                <Card
                  key={review.id}
                  className={
                    isOverdue(review.createdAt) ? "border-red-200" : ""
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <CardTitle className="text-lg">
                            {review.project.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            {review.project.projectId} •{" "}
                            {review.project.cluster.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStageColor(review.stage)}>
                          {review.stage.replace("STAGE_", "Stage ")}
                        </Badge>
                        {isOverdue(review.createdAt) && (
                          <Badge className="bg-red-100 text-red-800">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        {review.project.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Lead: {review.project.lead.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Submitted:{" "}
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewDialog(review)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending reviews</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          {completedReviews.length > 0 ? (
            <div className="space-y-4">
              {completedReviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <CardTitle className="text-lg">
                            {review.project.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            {review.project.projectId} •{" "}
                            {review.project.cluster.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStageColor(review.stage)}>
                          {review.stage.replace("STAGE_", "Stage ")}
                        </Badge>
                        <Badge className={getDecisionColor(review.decision)}>
                          {review.decision || "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Decision
                          </p>
                          <p className="text-lg font-semibold">
                            {review.decision || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Score
                          </p>
                          <div className="flex items-center space-x-1">
                            <p className="text-lg font-semibold">
                              {review.score || "N/A"}
                            </p>
                            {review.score && (
                              <div className="flex">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.score!
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Review Date
                          </p>
                          <p className="text-lg font-semibold">
                            {review.reviewDate
                              ? new Date(review.reviewDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      {review.comments && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">
                            Comments
                          </p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {review.comments}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>Reviewer: {review.reviewer.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Completed:{" "}
                            {review.reviewDate
                              ? new Date(review.reviewDate).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No completed reviews</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-reviews" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                My review history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Gate Review: {selectedReview?.project.name}
            </DialogTitle>
            <DialogDescription>
              {selectedReview?.stage.replace("STAGE_", "Stage ")} Review for{" "}
              {selectedReview?.project.projectId}
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6">
              {/* Project Information */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Project Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Project Lead:</span>{" "}
                    {selectedReview.project.lead.name}
                  </div>
                  <div>
                    <span className="font-medium">Cluster:</span>{" "}
                    {selectedReview.project.cluster.name}
                  </div>
                  <div>
                    <span className="font-medium">Current Stage:</span>{" "}
                    {selectedReview.project.currentStage.replace(
                      "STAGE_",
                      "Stage "
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {selectedReview.project.status.replace("_", " ")}
                  </div>
                </div>
                {selectedReview.project.description && (
                  <div className="mt-3">
                    <span className="font-medium">Description:</span>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedReview.project.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="decision">Review Decision *</Label>
                  <Select
                    value={reviewForm.decision}
                    onValueChange={(value) =>
                      setReviewForm({ ...reviewForm, decision: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GO">
                        GO - Proceed to next stage
                      </SelectItem>
                      <SelectItem value="RECYCLE">
                        RECYCLE - Revise and resubmit
                      </SelectItem>
                      <SelectItem value="HOLD">HOLD - Put on hold</SelectItem>
                      <SelectItem value="STOP">
                        STOP - Terminate project
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="score">Score (1-5)</Label>
                  <Select
                    value={reviewForm.score.toString()}
                    onValueChange={(value) =>
                      setReviewForm({ ...reviewForm, score: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={reviewForm.comments}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comments: e.target.value })
                    }
                    placeholder="Provide detailed feedback and recommendations..."
                    rows={4}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitReview} disabled={isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
