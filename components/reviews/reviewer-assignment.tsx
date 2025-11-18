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

interface ReviewerAssignmentProps {
  availableReviewers: any[];
  currentSession?: any;
  onAssignReviewers: (reviewerIds: string[], dueDate?: Date) => void;
  isLoading: boolean;
}

export function ReviewerAssignment({
  availableReviewers,
  currentSession,
  onAssignReviewers,
  isLoading,
}: ReviewerAssignmentProps) {
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");

  const handleReviewerToggle = (reviewerId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId)
        ? prev.filter((id) => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const handleSubmit = () => {
    if (selectedReviewers.length === 0) {
      toast.error("Please select at least one reviewer");
      return;
    }

    const dueDateObj = dueDate ? new Date(dueDate) : undefined;
    onAssignReviewers(selectedReviewers, dueDateObj);
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

  if (currentSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Reviewers Already Assigned</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSession.reviewAssignments?.map((assignment: any) => (
                <Card key={assignment.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {assignment.reviewer.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {assignment.reviewer.email}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge
                          className={getRoleColor(assignment.reviewer.role)}
                        >
                          {assignment.reviewer.role}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            assignment.status === "COMPLETED"
                              ? "text-green-600"
                              : assignment.status === "IN_PROGRESS"
                                ? "text-blue-600"
                                : "text-gray-600"
                          }
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Review session is active</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Reviewers have been assigned and notified. The review process is
                now in progress.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Assign Reviewers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reviewer Selection */}
          <div>
            <Label className="text-base font-medium mb-4 block">
              Select Reviewers ({selectedReviewers.length} selected)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableReviewers.map((reviewer) => (
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
                <div>• Each reviewer will receive an email notification</div>
                <div>
                  • All reviews must be completed before the session can be
                  approved
                </div>
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
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedReviewers.length === 0 || isLoading}
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
                <strong>Minimum Reviewers:</strong> At least 2 reviewers are
                recommended for thorough evaluation
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
                <strong>Completion Requirement:</strong> ALL assigned reviewers
                must complete their reviews before the session can be approved
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div>
                <strong>Notifications:</strong> Assigned reviewers will receive
                email notifications with review instructions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
