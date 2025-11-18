"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Calculator,
  DollarSign,
  Users,
  Shield,
  Handshake,
  Briefcase,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface ReviewSummaryProps {
  evaluationData: any;
  projectName: string;
}

export function ReviewSummary({
  evaluationData,
  projectName,
}: ReviewSummaryProps) {
  if (!evaluationData) return null;

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

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "GO":
        return CheckCircle;
      case "RECYCLE":
        return TrendingUp;
      case "HOLD":
        return AlertTriangle;
      case "STOP":
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  };

  const criteriaIcons = {
    strategic_alignment: TrendingUp,
    technical_feasibility: Calculator,
    financial_viability: DollarSign,
    resource_readiness: Users,
    risk_compliance: Shield,
    stakeholder_support: Handshake,
    business_development: Briefcase,
  };

  const RecommendationIcon = getRecommendationIcon(
    evaluationData.recommendation
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RecommendationIcon className="h-5 w-5" />
          <span>Review Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {evaluationData.totalScore}/5.0
          </div>
          <div className="text-sm text-gray-600 mb-2">Overall Score</div>
          <Progress value={evaluationData.totalScore * 20} className="h-2" />
        </div>

        {/* Recommendation */}
        <div className="flex items-center justify-center space-x-3">
          <span className="text-sm font-medium">Recommendation:</span>
          <Badge
            className={getRecommendationColor(evaluationData.recommendation)}
          >
            <RecommendationIcon className="h-4 w-4 mr-1" />
            {evaluationData.recommendation}
          </Badge>
        </div>

        {/* Criteria Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Criteria Scores</h4>
          {evaluationData.criteria?.map((criterion: any) => {
            const IconComponent =
              criteriaIcons[criterion.id as keyof typeof criteriaIcons] ||
              TrendingUp;
            const weightedScore = (criterion.score * criterion.weight) / 100;

            return (
              <div
                key={criterion.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{criterion.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {criterion.weight}%
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{criterion.score}/5</span>
                  <span
                    className={`text-sm font-medium ${getScoreColor(criterion.score)}`}
                  >
                    ({weightedScore.toFixed(2)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comments Preview */}
        {evaluationData.comments && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Comments</h4>
            <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
              {evaluationData.comments.length > 150
                ? `${evaluationData.comments.substring(0, 150)}...`
                : evaluationData.comments}
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Key Insights</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {evaluationData.totalScore >= 4 && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Strong overall performance across criteria</span>
              </div>
            )}
            {evaluationData.totalScore < 3 && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Significant concerns identified</span>
              </div>
            )}
            {evaluationData.criteria?.some((c: any) => c.score <= 2) && (
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Some criteria scored below average</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
