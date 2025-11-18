"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Users,
  ClipboardCheck,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { UploadDocumentForm } from "@/components/documents/upload-document-form";
import { RaiseRedFlagForm } from "@/components/red-flags/raise-red-flag-form";
import { AddMemberForm } from "@/components/team/add-member-form";
import { GateReviewForm } from "@/components/gate-reviews/gate-review-form";
import { CommentSection } from "@/components/comments/comment-section";
import { RedFlagSection } from "@/components/red-flags/red-flag-section";

interface ProjectTabsProps {
  project: {
    id: string;
    name: string;
    currentStage: string;
    leadId: string;
  };
  documents: Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    fileUrl: string;
    fileName: string;
    fileSize: number | null;
    mimeType: string | null;
    isRequired: boolean;
    isApproved: boolean | null;
    version: string;
    createdAt: Date;
    uploader: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  gateReviews: Array<{
    id: string;
    stage: string;
    decision: string | null;
    score: number | null;
    comments: string | null;
    reviewDate: Date | null;
    isCompleted: boolean;
    createdAt: Date;
    reviewer: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  redFlags: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    resolvedAt: Date | null;
    createdAt: Date;
    raisedBy: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  members: Array<{
    id: string;
    role: string;
    user: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  activities: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: Date;
    user: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  availableUsers?: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    department: string | null;
  }>;
  currentUser?: {
    id: string;
    role: string;
  };
}

const getDocumentTypeColor = (type: string) => {
  switch (type) {
    case "BUSINESS_CASE":
      return "bg-blue-100 text-blue-800";
    case "RESEARCH_PLAN":
      return "bg-purple-100 text-purple-800";
    case "TECHNICAL_SPEC":
      return "bg-green-100 text-green-800";
    case "RISK_ASSESSMENT":
      return "bg-red-100 text-red-800";
    case "BUDGET_PLAN":
      return "bg-yellow-100 text-yellow-800";
    case "MILESTONE_REPORT":
      return "bg-indigo-100 text-indigo-800";
    case "FINAL_REPORT":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-800 border-red-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "LOW":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getDecisionColor = (decision: string | null) => {
  switch (decision) {
    case "GO":
      return "bg-green-100 text-green-800";
    case "RECYCLE":
      return "bg-yellow-100 text-yellow-800";
    case "HOLD":
      return "bg-orange-100 text-orange-800";
    case "STOP":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown size";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

const formatDocumentType = (type: string) => {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

function ProjectTabs({
  project,
  documents,
  gateReviews,
  redFlags,
  members,
  activities,
  availableUsers = [],
  currentUser,
}: ProjectTabsProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showRedFlagForm, setShowRedFlagForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  // Check if current user can review projects
  const canReview =
    currentUser &&
    (currentUser.role === "ADMIN" ||
      currentUser.role === "GATEKEEPER" ||
      currentUser.role === "REVIEWER" ||
      (currentUser.role === "PROJECT_LEAD" &&
        project.leadId === currentUser.id));
  return (
    <Card className="bg-white rounded-lg shadow">
      <CardContent className="p-6">
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Gate Reviews ({gateReviews.length})
            </TabsTrigger>
            <TabsTrigger value="redflags" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Red Flags ({redFlags.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team ({members.length + 1})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activity ({activities.length})
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Project Documents</h3>
              <Button onClick={() => setShowUploadForm(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents uploaded yet</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {doc.name}
                          </h4>
                          <Badge className={getDocumentTypeColor(doc.type)}>
                            {formatDocumentType(doc.type)}
                          </Badge>
                          {doc.isRequired && (
                            <Badge
                              variant="outline"
                              className="text-red-600 border-red-200"
                            >
                              Required
                            </Badge>
                          )}
                          {doc.isApproved === true && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {doc.isApproved === false && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>v{doc.version}</span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>
                            Uploaded{" "}
                            {formatDistanceToNow(new Date(doc.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span>
                            by {doc.uploader.name || doc.uploader.email}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Gate Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Gate Reviews</h3>
              {canReview && (
                <Button onClick={() => setShowReviewForm(true)}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  New Review
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {gateReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No gate reviews conducted yet</p>
                </div>
              ) : (
                gateReviews.map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">
                          {review.stage.replace("_", " ")} Review
                        </h4>
                        {review.decision && (
                          <Badge className={getDecisionColor(review.decision)}>
                            {review.decision}
                          </Badge>
                        )}
                        {review.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      {review.score && (
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">
                            {review.score}/10
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={review.reviewer.image || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {review.reviewer.name?.charAt(0) ||
                              review.reviewer.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {review.reviewer.name || review.reviewer.email}
                        </span>
                      </div>
                      <span>
                        {review.reviewDate
                          ? formatDistanceToNow(new Date(review.reviewDate), {
                              addSuffix: true,
                            })
                          : `Created ${formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}`}
                      </span>
                    </div>

                    {review.comments && (
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p className="text-gray-700">{review.comments}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Red Flags Tab */}
          <TabsContent value="redflags" className="mt-6">
            <RedFlagSection projectId={project.id} />
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-6">
            <CommentSection
              projectId={project.id}
              title="Project Discussion"
              showExport={true}
            />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Project Team</h3>
              <Button onClick={() => setShowAddMemberForm(true)}>
                <Users className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback>
                      {member.user.name?.charAt(0) ||
                        member.user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {member.user.name || member.user.email}
                    </h4>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>

            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border-l-2 border-blue-200 bg-blue-50/30"
                  >
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={activity.user.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {activity.user.name?.charAt(0) ||
                          activity.user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {activity.user.name || activity.user.email}
                        </span>
                        <span className="text-sm text-gray-500">
                          {activity.action.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-gray-700 mb-2">
                          {activity.details}
                        </p>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Forms */}
      <UploadDocumentForm
        open={showUploadForm}
        onOpenChange={setShowUploadForm}
        projectId={project.id}
      />

      <RaiseRedFlagForm
        open={showRedFlagForm}
        onOpenChange={setShowRedFlagForm}
        projectId={project.id}
      />

      <AddMemberForm
        open={showAddMemberForm}
        onOpenChange={setShowAddMemberForm}
        projectId={project.id}
        availableUsers={availableUsers}
      />

      {selectedReview && canReview && (
        <GateReviewForm
          open={showReviewForm}
          onOpenChange={setShowReviewForm}
          review={selectedReview}
        />
      )}
    </Card>
  );
}
export default ProjectTabs;
