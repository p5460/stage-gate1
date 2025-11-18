"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Shield,
  Handshake,
  Briefcase,
} from "lucide-react";

interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  score: number;
  icon: any;
  description: string;
}

interface EvaluationMatrixProps {
  projectId?: string;
  onSave?: (evaluation: any) => void;
  initialData?: any;
}

interface CriteriaGuidelines {
  excellent: string;
  average: string;
  poor: string;
}

interface ExtendedEvaluationCriteria extends EvaluationCriteria {
  guidelines: CriteriaGuidelines;
}

const defaultCriteria: ExtendedEvaluationCriteria[] = [
  {
    id: "strategic_alignment",
    name: "Strategic Alignment",
    weight: 22,
    score: 5,
    icon: TrendingUp,
    description: "Alignment with organizational strategy and goals",
    guidelines: {
      excellent: "Aligns with core strategy (5)",
      average: "Partial support (3)",
      poor: "Misaligned (1)",
    },
  },
  {
    id: "technical_feasibility",
    name: "Technical Feasibility",
    weight: 22,
    score: 5,
    icon: Calculator,
    description: "Technical viability and implementation complexity",
    guidelines: {
      excellent: "Proven & low risk (5)",
      average: "Moderate risk (3)",
      poor: "High risk/unproven (1)",
    },
  },
  {
    id: "financial_viability",
    name: "Financial Viability",
    weight: 22,
    score: 4,
    icon: DollarSign,
    description: "Financial returns and cost-benefit analysis",
    guidelines: {
      excellent: "High ROI/strong case (5)",
      average: "Moderate ROI (3)",
      poor: "Weak ROI/unclear benefits (1)",
    },
  },
  {
    id: "resource_readiness",
    name: "Resource Readiness",
    weight: 10,
    score: 5,
    icon: Users,
    description: "Availability of required resources and capabilities",
    guidelines: {
      excellent: "Fully ready; all key resources available (5)",
      average: "Partially ready; some gaps exist (3)",
      poor: "Not ready; major resource gaps (1)",
    },
  },
  {
    id: "risk_compliance",
    name: "Risk & Compliance",
    weight: 5,
    score: 3,
    icon: Shield,
    description: "Risk assessment and regulatory compliance",
    guidelines: {
      excellent: "Minimal risk (5)",
      average: "Manageable risk (3)",
      poor: "High risk/non-compliant (1)",
    },
  },
  {
    id: "stakeholder_support",
    name: "Stakeholder Support",
    weight: 5,
    score: 5,
    icon: Handshake,
    description: "Level of stakeholder buy-in and support",
    guidelines: {
      excellent: "Strong buy-in (5)",
      average: "Partial support (3)",
      poor: "Limited/no support (1)",
    },
  },
  {
    id: "business_development",
    name: "Business Development & Commercialisation",
    weight: 14,
    score: 4,
    icon: Briefcase,
    description: "Market potential and commercialization strategy",
    guidelines: {
      excellent: "High market & commercial readiness (5)",
      average: "Moderate readiness (3)",
      poor: "Low readiness (1)",
    },
  },
];

export function EvaluationMatrix({
  projectId,
  onSave,
  initialData,
}: EvaluationMatrixProps) {
  const [criteria, setCriteria] = useState<ExtendedEvaluationCriteria[]>(
    initialData?.criteria || defaultCriteria
  );
  const [comments, setComments] = useState(initialData?.comments || "");
  const [recommendation, setRecommendation] = useState(
    initialData?.recommendation || "GO"
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateScore = (criteriaId: string, newScore: number) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === criteriaId ? { ...c, score: newScore } : c))
    );
    validateForm();
  };

  const validateForm = () => {
    const errors = [];

    if (!comments || comments.trim().length < 10) {
      errors.push("Review comments must be at least 10 characters long");
    }

    if (!recommendation) {
      errors.push("Please select a gate decision");
    }

    const unscoredCriteria = criteria.filter((c) => !c.score || c.score < 1);
    if (unscoredCriteria.length > 0) {
      errors.push(
        `Please score all criteria: ${unscoredCriteria.map((c) => c.name).join(", ")}`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const calculateWeightedScore = () => {
    return criteria.reduce((total, criterion) => {
      return total + (criterion.score * criterion.weight) / 100;
    }, 0);
  };

  const getTotalScore = () => {
    const weightedScore = calculateWeightedScore();
    return Math.round(weightedScore * 100) / 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
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

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const evaluation = {
      criteria,
      comments,
      recommendation,
      totalScore: getTotalScore(),
      weightedScore: calculateWeightedScore(),
      projectId,
    };

    onSave?.(evaluation);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Evaluation Matrix</h2>
          <p className="text-sm text-gray-600">
            Score each criterion from 1 (Poor) to 5 (Excellent) based on the
            guidelines
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {getTotalScore()}/5.0
          </div>
          <div className="text-sm text-gray-500">Overall Score</div>
        </div>
      </div>

      {/* Scoring Guide */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Scoring Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
          <div className="text-center p-2 bg-red-100 rounded text-red-800">
            <div className="font-bold">1 - Poor</div>
            <div>Significant issues</div>
          </div>
          <div className="text-center p-2 bg-orange-100 rounded text-orange-800">
            <div className="font-bold">2 - Below Average</div>
            <div>Some concerns</div>
          </div>
          <div className="text-center p-2 bg-yellow-100 rounded text-yellow-800">
            <div className="font-bold">3 - Average</div>
            <div>Meets baseline</div>
          </div>
          <div className="text-center p-2 bg-lime-100 rounded text-lime-800">
            <div className="font-bold">4 - Good</div>
            <div>Above expectations</div>
          </div>
          <div className="text-center p-2 bg-green-100 rounded text-green-800">
            <div className="font-bold">5 - Excellent</div>
            <div>Exceptional</div>
          </div>
        </div>
      </Card>

      {/* Evaluation Criteria */}
      <div className="grid gap-4">
        {criteria.map((criterion) => {
          const IconComponent = criterion.icon;
          const weightedScore = (criterion.score * criterion.weight) / 100;

          return (
            <Card key={criterion.id} className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{criterion.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {criterion.description}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          •{" "}
                          <span className="text-green-600">
                            {criterion.guidelines.excellent}
                          </span>
                        </div>
                        <div>
                          •{" "}
                          <span className="text-yellow-600">
                            {criterion.guidelines.average}
                          </span>
                        </div>
                        <div>
                          •{" "}
                          <span className="text-red-600">
                            {criterion.guidelines.poor}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <Badge variant="outline">{criterion.weight}%</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        Score: {criterion.score}/5
                      </Label>
                      <span
                        className={`text-sm font-medium ${getScoreColor(criterion.score)}`}
                      >
                        Weighted: {weightedScore.toFixed(2)}
                      </span>
                    </div>

                    <input
                      type="range"
                      value={criterion.score}
                      onChange={(e) =>
                        updateScore(criterion.id, parseInt(e.target.value))
                      }
                      max={5}
                      min={1}
                      step={1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 - Poor</span>
                      <span>3 - Average</span>
                      <span>5 - Excellent</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {/* Summary */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-medium mb-4">Evaluation Summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getTotalScore()}
            </div>
            <div className="text-sm text-gray-600">Total Score</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(getTotalScore() * 20)}%
            </div>
            <div className="text-sm text-gray-600">Percentage</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {criteria.length}
            </div>
            <div className="text-sm text-gray-600">Criteria</div>
          </div>

          <div className="text-center">
            <Badge className={getRecommendationColor(recommendation)}>
              {recommendation}
            </Badge>
            <div className="text-sm text-gray-600 mt-1">Recommendation</div>
          </div>
        </div>

        <Progress value={getTotalScore() * 20} className="mb-4" />
      </Card>

      {/* Recommendation */}
      <Card className="p-4">
        <Label className="text-base font-medium">Gate Decision</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {["GO", "RECYCLE", "HOLD", "STOP"].map((option) => (
            <Button
              key={option}
              variant={recommendation === option ? "default" : "outline"}
              onClick={() => {
                setRecommendation(option);
                validateForm();
              }}
              className={
                recommendation === option ? getRecommendationColor(option) : ""
              }
            >
              {option}
            </Button>
          ))}
        </div>
      </Card>

      {/* Comments */}
      <Card className="p-4">
        <Label htmlFor="comments" className="text-base font-medium">
          Review Comments
        </Label>
        <Textarea
          id="comments"
          placeholder="Provide detailed comments about your evaluation..."
          value={comments}
          onChange={(e) => {
            setComments(e.target.value);
            validateForm();
          }}
          className="mt-2"
          rows={4}
        />
        <div className="mt-1 text-xs text-gray-500">
          {comments.length}/10 characters minimum
        </div>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start space-x-2">
            <div className="text-red-600 mt-0.5">⚠️</div>
            <div>
              <h4 className="font-medium text-red-800 mb-2">
                Please complete the following:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline">Save Draft</Button>
        <Button onClick={handleSave} disabled={validationErrors.length > 0}>
          Submit Review
        </Button>
      </div>
    </div>
  );
}
