import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProjectProgressProps {
  project: {
    budgetUtilization: number | null;
    documents: Array<{
      isRequired: boolean;
      isApproved: boolean | null;
    }>;
  };
}

export function ProjectProgress({ project }: ProjectProgressProps) {
  // Calculate progress metrics
  const budgetUtilization = project.budgetUtilization || 0;

  const requiredDocs = project.documents.filter((doc) => doc.isRequired);
  const approvedDocs = requiredDocs.filter((doc) => doc.isApproved === true);
  const documentationProgress =
    requiredDocs.length > 0
      ? (approvedDocs.length / requiredDocs.length) * 100
      : 0;

  // Mock stage completion - this would be calculated based on actual milestones/deliverables
  const stageCompletion = 65;

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Project Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Stage Completion
            </span>
            <span className="text-sm font-medium text-gray-700">
              {stageCompletion}%
            </span>
          </div>
          <Progress value={stageCompletion} className="h-3" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Documentation Submitted
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(documentationProgress)}%
            </span>
          </div>
          <Progress value={documentationProgress} className="h-3" />
          <p className="text-xs text-gray-500 mt-1">
            {approvedDocs.length} of {requiredDocs.length} required documents
            approved
          </p>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Budget Utilization
            </span>
            <span className="text-sm font-medium text-gray-700">
              {budgetUtilization}%
            </span>
          </div>
          <Progress value={budgetUtilization} className="h-3" />
        </div>

        {/* Progress Summary */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-800 mb-3">
            Progress Summary
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Documents:</span>
              <span className="font-medium">{project.documents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Required Documents:</span>
              <span className="font-medium">{requiredDocs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Approved Documents:</span>
              <span className="font-medium text-green-600">
                {approvedDocs.length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
