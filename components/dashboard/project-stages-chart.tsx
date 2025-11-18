"use client";

interface ProjectStagesChartProps {
  data: Array<{
    currentStage: string;
    _count: number;
  }>;
}

const stageNames = {
  STAGE_0: "Stage 0: Concept",
  STAGE_1: "Stage 1: Research Planning",
  STAGE_2: "Stage 2: Feasibility",
  STAGE_3: "Stage 3: Maturation",
};

const stageColors = {
  STAGE_0: "bg-blue-600",
  STAGE_1: "bg-purple-600",
  STAGE_2: "bg-green-600",
  STAGE_3: "bg-yellow-600",
};

export function ProjectStagesChart({ data }: ProjectStagesChartProps) {
  // Default data if none provided
  const defaultData = [
    { currentStage: "STAGE_0", _count: 4 },
    { currentStage: "STAGE_1", _count: 9 },
    { currentStage: "STAGE_2", _count: 7 },
    { currentStage: "STAGE_3", _count: 4 },
  ];

  const displayData = data.length > 0 ? data : defaultData;
  const total = displayData.reduce((sum, item) => sum + item._count, 0);

  const processedData = Object.entries(stageNames).map(([stage, name]) => {
    const item = displayData.find((d) => d.currentStage === stage);
    const count = item?._count || 0;
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return {
      stage,
      name,
      count,
      percentage,
      color: stageColors[stage as keyof typeof stageColors],
    };
  });

  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Projects by Stage
      </h2>
      <div className="space-y-4">
        {processedData.map((item) => (
          <div key={item.stage}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {item.name}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {item.count}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full progress-bar`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
