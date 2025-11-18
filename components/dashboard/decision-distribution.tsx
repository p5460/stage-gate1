"use client";

export function DecisionDistribution() {
  const decisions = [
    {
      type: "GO",
      count: 14,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      type: "RECYCLE",
      count: 4,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      type: "HOLD",
      count: 2,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      type: "STOP",
      count: 1,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
  ];

  return (
    <div className="mt-6">
      <h3 className="text-md font-medium text-gray-800 mb-2">
        Decision Distribution (Last 30 days)
      </h3>
      <div className="flex justify-between space-x-2">
        {decisions.map((decision) => (
          <div key={decision.type} className="flex-1 text-center">
            <div
              className={`h-32 ${decision.bgColor} rounded-t-lg flex items-end`}
            >
              <div
                className={`w-full ${decision.color} rounded-t-lg`}
                style={{
                  height:
                    decision.type === "GO"
                      ? "65%"
                      : decision.type === "RECYCLE"
                        ? "20%"
                        : decision.type === "HOLD"
                          ? "10%"
                          : "5%",
                }}
              ></div>
            </div>
            <div className="bg-white p-2 rounded-b-lg shadow">
              <p className={`text-sm font-medium ${decision.textColor}`}>
                {decision.type}
              </p>
              <p className="text-xs text-gray-500">{decision.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
