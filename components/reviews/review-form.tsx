"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EvaluationMatrix } from "./evaluation-matrix";
import { ReviewSummary } from "./review-summary";
import {
  ClipboardCheck,
  FileText,
  TrendingUp,
  Calendar,
  User,
  Building,
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  project: {
    id: string;
    name: string;
    projectId: string;
    description?: string;
    currentStage: string;
    lead: { name: string; email: string };
    cluster: { name: string };
  };
  review?: {
    id: string;
    stage: string;
    score?: number;
    comments?: string;
    decision?: string;
    isCompleted: boolean;
  };
  onSubmit?: (reviewData: any) => Promise<any>;
  onSaveDraft?: (reviewData: any) => Promise<any>;
}

export function ReviewForm({
  project,
  review,
  onSubmit,
  onSaveDraft,
}: ReviewFormProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Calculate review progress
  const getReviewProgress = () => {
    if (!evaluationData) return 0;

    let completedItems = 0;
    const totalItems = 4; // criteria, comments, recommendation, final review

    if (evaluationData.criteria && evaluationData.criteria.length > 0)
      completedItems++;
    if (evaluationData.comments && evaluationData.comments.trim())
      completedItems++;
    if (evaluationData.recommendation) completedItems++;
    if (evaluationData.totalScore) completedItems++;

    return Math.round((completedItems / totalItems) * 100);
  };

  const handleEvaluationSave = (evaluation: any) => {
    setEvaluationData(evaluation);
    // Auto-save draft when evaluation data changes
    handleSaveDraft(evaluation, false);
  };

  const handleSaveDraft = async (
    evaluation: any = evaluationData,
    showToast: boolean = true
  ) => {
    if (!evaluation || !onSaveDraft) return;

    setIsSavingDraft(true);

    try {
      // Sanitize criteria data to remove non-serializable properties
      const sanitizedCriteria = evaluation.criteria?.map((criterion: any) => ({
        id: criterion.id,
        name: criterion.name,
        weight: criterion.weight,
        score: criterion.score,
        description: criterion.description,
        // Remove icon and other non-serializable properties
      }));

      const draftData = {
        projectId: project.id,
        stage: project.currentStage,
        score: evaluation.totalScore,
        comments: evaluation.comments,
        decision: evaluation.recommendation,
        evaluationData: {
          criteria: sanitizedCriteria,
          totalScore: evaluation.totalScore,
          weightedScore: evaluation.weightedScore,
        },
      };

      const result = await onSaveDraft(draftData);

      if (result.success) {
        setLastSaved(new Date());
        if (showToast) {
          toast.success("Draft saved successfully");
        }
      } else {
        throw new Error(result.error || "Failed to save draft");
      }
    } catch (error) {
      if (showToast) {
        toast.error("Failed to save draft");
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const validateReview = () => {
    if (!evaluationData)
      return {
        isValid: false,
        errors: ["Please complete the evaluation matrix"],
      };

    const errors = [];

    if (!evaluationData.criteria || evaluationData.criteria.length === 0) {
      errors.push("Please score all evaluation criteria");
    }

    if (!evaluationData.recommendation) {
      errors.push("Please select a gate decision (GO, RECYCLE, HOLD, or STOP)");
    }

    if (
      !evaluationData.comments ||
      evaluationData.comments.trim().length < 10
    ) {
      errors.push(
        "Please provide detailed review comments (minimum 10 characters)"
      );
    }

    // Check if all criteria have been scored
    if (evaluationData.criteria) {
      const unscoredCriteria = evaluationData.criteria.filter(
        (c: any) => !c.score || c.score < 1
      );
      if (unscoredCriteria.length > 0) {
        errors.push("Please score all evaluation criteria (1-5 scale)");
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmitReview = async () => {
    if (!onSubmit) return;

    const validation = validateReview();

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to submit this review?\n\n` +
        `Decision: ${evaluationData.recommendation}\n` +
        `Score: ${evaluationData.totalScore}/5.0\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      // Sanitize criteria data to remove non-serializable properties
      const sanitizedCriteria = evaluationData.criteria?.map(
        (criterion: any) => ({
          id: criterion.id,
          name: criterion.name,
          weight: criterion.weight,
          score: criterion.score,
          description: criterion.description,
          // Remove icon and other non-serializable properties
        })
      );

      const reviewData = {
        projectId: project.id,
        stage: project.currentStage,
        score: evaluationData.totalScore,
        comments: evaluationData.comments,
        decision: evaluationData.recommendation,
        evaluationData: {
          criteria: sanitizedCriteria,
          totalScore: evaluationData.totalScore,
          weightedScore: evaluationData.weightedScore,
        },
      };

      const result = await onSubmit(reviewData);

      if (result.success) {
        toast.success(
          "Review submitted successfully! Project status has been updated."
        );
        // Redirect to review dashboard
        window.location.href = `/projects/${project.id}/review`;
      } else {
        throw new Error(result.error || "Failed to submit review");
      }
    } catch (error) {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center space-x-3">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-2xl">Gate Review</CardTitle>
                <Badge className={getStageColor(project.currentStage)}>
                  {formatStage(project.currentStage)}
                </Badge>
              </div>
              <div className="text-gray-600">
                Conducting review for {project.name}
              </div>

              {/* Progress Bar */}
              {!review?.isCompleted && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Review Progress</span>
                    <span className="font-medium">{getReviewProgress()}%</span>
                  </div>
                  <Progress value={getReviewProgress()} className="h-2" />
                </div>
              )}

              {/* Auto-save Status */}
              {lastSaved && !review?.isCompleted && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Save className="h-4 w-4" />
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {review?.isCompleted ? (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              ) : evaluationData ? (
                <Badge variant="outline" className="text-blue-600">
                  <Clock className="h-4 w-4 mr-1" />
                  In Progress
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Not Started
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      {/* Project Information */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Project ID</div>
                <div className="font-medium">{project.projectId}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Project Lead</div>
                <div className="font-medium">{project.lead.name}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Cluster</div>
                <div className="font-medium">{project.cluster.name}</div>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="evaluation"
            className="flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Evaluation</span>
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Evaluation Criteria</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Strategic Alignment</span>
                      <Badge variant="outline">22%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Technical Feasibility</span>
                      <Badge variant="outline">22%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Financial Viability</span>
                      <Badge variant="outline">22%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Resource Readiness</span>
                      <Badge variant="outline">10%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk & Compliance</span>
                      <Badge variant="outline">5%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Stakeholder Support</span>
                      <Badge variant="outline">5%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Business Development</span>
                      <Badge variant="outline">14%</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Scoring Scale</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>5 - Excellent:</span>
                        <span className="text-green-600">
                          Exceptional performance
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>4 - Good:</span>
                        <span className="text-lime-600">
                          Above expectations
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>3 - Average:</span>
                        <span className="text-yellow-600">Meets baseline</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2 - Below Average:</span>
                        <span className="text-orange-600">Some concerns</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 - Poor:</span>
                        <span className="text-red-600">Significant issues</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Decision Options</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        • <strong className="text-green-600">GO:</strong>{" "}
                        Proceed to next stage
                      </div>
                      <div>
                        • <strong className="text-yellow-600">RECYCLE:</strong>{" "}
                        Revise and resubmit
                      </div>
                      <div>
                        • <strong className="text-blue-600">HOLD:</strong> Pause
                        for external factors
                      </div>
                      <div>
                        • <strong className="text-red-600">STOP:</strong>{" "}
                        Terminate project
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Evaluation Table */}
          <Card>
            <CardHeader>
              <CardTitle>Example Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">
                        Evaluation Area
                      </th>
                      <th className="text-center py-2 font-medium">Weight %</th>
                      <th className="text-center py-2 font-medium">Rank</th>
                      <th className="text-center py-2 font-medium">Score</th>
                      <th className="text-center py-2 font-medium">
                        Weighted Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b">
                      <td className="py-2">Strategic Alignment</td>
                      <td className="text-center py-2">22%</td>
                      <td className="text-center py-2">1</td>
                      <td className="text-center py-2">5</td>
                      <td className="text-center py-2 font-medium text-green-600">
                        1.1
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Technical Feasibility</td>
                      <td className="text-center py-2">22%</td>
                      <td className="text-center py-2">2</td>
                      <td className="text-center py-2">5</td>
                      <td className="text-center py-2 font-medium text-green-600">
                        1.1
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Financial Viability</td>
                      <td className="text-center py-2">22%</td>
                      <td className="text-center py-2">3</td>
                      <td className="text-center py-2">4</td>
                      <td className="text-center py-2 font-medium text-yellow-600">
                        0.88
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Resource Readiness</td>
                      <td className="text-center py-2">10%</td>
                      <td className="text-center py-2">4</td>
                      <td className="text-center py-2">5</td>
                      <td className="text-center py-2 font-medium text-green-600">
                        0.5
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Risk & Compliance</td>
                      <td className="text-center py-2">5%</td>
                      <td className="text-center py-2">5</td>
                      <td className="text-center py-2">3</td>
                      <td className="text-center py-2 font-medium text-yellow-600">
                        0.15
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Stakeholder Support</td>
                      <td className="text-center py-2">5%</td>
                      <td className="text-center py-2">1</td>
                      <td className="text-center py-2">5</td>
                      <td className="text-center py-2 font-medium text-green-600">
                        0.25
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">
                        Business Development & Commercialisation
                      </td>
                      <td className="text-center py-2">14%</td>
                      <td className="text-center py-2">2</td>
                      <td className="text-center py-2">4</td>
                      <td className="text-center py-2 font-medium text-yellow-600">
                        0.56
                      </td>
                    </tr>
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td className="py-2 font-bold">Total</td>
                      <td className="text-center py-2 font-bold">100%</td>
                      <td className="text-center py-2">-</td>
                      <td className="text-center py-2">-</td>
                      <td className="text-center py-2 font-bold text-blue-600">
                        3.95
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Example Interpretation:</strong> This project scores
                    3.95/5.0 overall, indicating strong performance across most
                    criteria. The ranking shows relative importance, with
                    Strategic Alignment and Stakeholder Support being top
                    priorities.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Detailed Scoring Guidelines:
                  </h5>
                  <div className="text-xs text-gray-700 space-y-1">
                    <div>
                      <strong>Strategic Alignment:</strong> Aligns with core
                      strategy (5), partial support (3), misaligned (1)
                    </div>
                    <div>
                      <strong>Technical Feasibility:</strong> Proven & low risk
                      (5), moderate risk (3), high risk/unproven (1)
                    </div>
                    <div>
                      <strong>Financial Viability:</strong> High ROI/strong case
                      (5), moderate ROI (3), weak ROI/unclear benefits (1)
                    </div>
                    <div>
                      <strong>Resource Readiness:</strong> Fully ready; all key
                      resources available (5), partially ready; some gaps exist
                      (3), not ready; major resource gaps (1)
                    </div>
                    <div>
                      <strong>Risk & Compliance:</strong> Minimal risk (5),
                      manageable risk (3), high risk/non-compliant (1)
                    </div>
                    <div>
                      <strong>Stakeholder Support:</strong> Strong buy-in (5),
                      partial support (3), limited/no support (1)
                    </div>
                    <div>
                      <strong>Business Development:</strong> High market &
                      commercial readiness (5), moderate readiness (3), low
                      readiness (1)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EvaluationMatrix
                projectId={project.id}
                onSave={handleEvaluationSave}
                initialData={review}
              />
            </div>
            <div className="lg:col-span-1">
              <ReviewSummary
                evaluationData={evaluationData}
                projectName={project.name}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Document review functionality will be implemented here</p>
                <p className="text-sm">
                  Check project documents and deliverables
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Previous reviews and decisions will be shown here</p>
                <p className="text-sm">
                  Track project progression through gates
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Actions */}
      {!review?.isCompleted && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Progress Summary */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Review Completion Status</div>
                  <div className="text-sm text-gray-600">
                    {getReviewProgress()}% complete -{" "}
                    {evaluationData
                      ? "Ready to submit"
                      : "Complete evaluation to proceed"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {getReviewProgress()}%
                  </div>
                  <div className="text-xs text-gray-500">Progress</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {evaluationData ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Evaluation complete - ready to submit</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Complete the evaluation matrix to submit your review
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSaveDraft(evaluationData, true)}
                    disabled={!evaluationData || isSavingDraft}
                  >
                    {isSavingDraft ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={
                      !evaluationData ||
                      isSubmitting ||
                      getReviewProgress() < 75
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
