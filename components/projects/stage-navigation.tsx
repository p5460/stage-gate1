import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StageNavigationProps {
  project: {
    currentStage: string;
    gateReviews: Array<{
      stage: string;
      decision: string | null;
      isCompleted: boolean;
    }>;
  };
}

const stages = [
  { key: "STAGE_0", name: "Concept", number: 0 },
  { key: "STAGE_1", name: "Research Planning", number: 1 },
  { key: "STAGE_2", name: "Feasibility", number: 2 },
  { key: "STAGE_3", name: "Maturation", number: 3 },
];

const getStageStatus = (
  stageKey: string,
  currentStage: string,
  gateReviews: any[]
) => {
  const stageIndex = stages.findIndex((s) => s.key === stageKey);
  const currentIndex = stages.findIndex((s) => s.key === currentStage);

  if (stageIndex < currentIndex) {
    return "completed";
  } else if (stageIndex === currentIndex) {
    return "active";
  } else {
    return "pending";
  }
};

const getStageColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-blue-50 border-blue-200 text-blue-800";
    case "active":
      return "bg-purple-50 border-purple-200 text-purple-800";
    case "pending":
      return "bg-gray-50 border-gray-200 text-gray-600";
    default:
      return "bg-gray-50 border-gray-200 text-gray-600";
  }
};

const getBadgeColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "active":
      return "bg-purple-100 text-purple-800";
    case "pending":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    default:
      return "Pending";
  }
};

export function StageNavigation({ project }: StageNavigationProps) {
  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Stage Navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {stages.map((stage) => {
            const status = getStageStatus(
              stage.key,
              project.currentStage,
              project.gateReviews
            );
            const gateReview = project.gateReviews.find(
              (review) => review.stage === stage.key
            );

            return (
              <div
                key={stage.key}
                className={cn(
                  "cursor-pointer rounded-lg p-4 text-center border-2 transition-all duration-200 hover:shadow-md",
                  getStageColor(status)
                )}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-white shadow-sm">
                  <span className="font-bold text-lg">{stage.number}</span>
                </div>
                <h4 className="font-medium mb-2">{stage.name}</h4>
                <Badge className={getBadgeColor(status)}>
                  {getStatusLabel(status)}
                </Badge>

                {gateReview && gateReview.isCompleted && (
                  <div className="mt-2">
                    <Badge
                      className={cn(
                        "text-xs",
                        gateReview.decision === "GO"
                          ? "bg-green-100 text-green-800"
                          : gateReview.decision === "RECYCLE"
                            ? "bg-yellow-100 text-yellow-800"
                            : gateReview.decision === "HOLD"
                              ? "bg-blue-100 text-blue-800"
                              : gateReview.decision === "STOP"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {gateReview.decision || "Pending"}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
