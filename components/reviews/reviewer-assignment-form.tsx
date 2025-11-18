"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus,
  Users,
  Calendar,
  Mail,
  Building,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ReviewerAssignmentFormProps {
  project: any;
  availableReviewers: any[];
  currentReviewers: any[];
}

export function ReviewerAssignmentForm({
  project,
  availableReviewers,
  currentReviewers,
}: ReviewerAssignmentFormProps) {
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReviewerToggle = (reviewerId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId)
        ? prev.filter((id) => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const handleSubmit = async () => {
    if (selectedReviewers.length === 0) {
      toast.error("Please select at least one reviewer");
      return;
    }

    setIsLoading(true);

    try {
      // Use the review-sessions API to assign multiple reviewers
      const response = await fetch("/api/review-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          stage: project.currentStage,
          reviewerIds: selectedReviewers,
          dueDate: dueDate || null,
          instructions,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Successfully assigned ${selectedReviewers.length} reviewer(s)`
        );
        router.push(`/projects/${project.id}/review`);
      } else {
        throw new Error(result.error || "Failed to assign reviewers");
      }
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error("Failed to assign reviewers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "GATEKEEPER":
        return "bg-purple-100 text-purple-800";
      case "REVIEWER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter out already assigned reviewers
  const currentReviewerIds = currentReviewers.map((r) => r.id);
  const unassignedReviewers = availableReviewers.filter(
    (reviewer) => !currentReviewerIds.includes(reviewer.id)
  );

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Select Additional Reviewers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reviewer Selection */}
          <div>
            <Label className="text-base font-medium mb-4 block">
              Available Reviewers ({selectedReviewers.length} selected)
            </Label>

            {unassignedReviewers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>All available reviewers have been assigned</p>
                <p className="text-sm">
                  No additional reviewers available for assignment
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unassignedReviewers.map((reviewer) => (
                  <Card
                    key={reviewer.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedReviewers.includes(reviewer.id)
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleReviewerToggle(reviewer.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedReviewers.includes(reviewer.id)}
                        onChange={() => handleReviewerToggle(reviewer.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{reviewer.name}</div>
                        <div className="text-sm text-gray-600 flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{reviewer.email}</span>
                        </div>
                        {reviewer.department && (
                          <div className="text-sm text-gray-600 flex items-center space-x-1 mt-1">
                            <Building className="h-3 w-3" />
                            <span>{reviewer.department}</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <Badge className={getRoleColor(reviewer.role)}>
                            {reviewer.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Due Date (Optional)</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Review Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Provide any specific instructions or context for the reviewers..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedReviewers.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">
                Assignment Summary
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>
                  • {selectedReviewers.length} reviewer(s) will be assigned
                </div>
                <div>• Each reviewer will receive a notification</div>
                <div>• Reviews are for stage: {project.currentStage}</div>
                {dueDate && (
                  <div>
                    • Due date: {new Date(dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                selectedReviewers.length === 0 ||
                isLoading ||
                unassignedReviewers.length === 0
              }
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Reviewers
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <strong>Multiple Reviews:</strong> You can assign multiple
                reviewers to get diverse perspectives
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <strong>Reviewer Roles:</strong> Only users with ADMIN,
                GATEKEEPER, or REVIEWER roles can be assigned
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <strong>Individual Reviews:</strong> Each reviewer will complete
                their evaluation independently
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <strong>Notifications:</strong> Assigned reviewers will be
                notified of their new assignment
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
