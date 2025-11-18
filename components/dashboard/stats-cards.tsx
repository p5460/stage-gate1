import {
  FolderOpen,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    activeProjects: number;
    pendingReviews: number;
    redFlags: number;
    approvalRate: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "12.5%",
      changeType: "positive",
      period: "vs last month",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingReviews,
      icon: ClipboardCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "2.3%",
      changeType: "negative",
      period: "vs last month",
    },
    {
      title: "Red Flags",
      value: stats.redFlags,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      change: "5.8%",
      changeType: "positive",
      period: "vs last month",
    },
    {
      title: "Approval Rate",
      value: `${stats.approvalRate}%`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "8.1%",
      changeType: "positive",
      period: "vs last quarter",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-full ${card.bgColor} ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`text-sm ${
                card.changeType === "positive"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {card.changeType === "positive" ? "↑" : "↓"} {card.change}
            </span>
            <span className="ml-2 text-sm text-gray-500">{card.period}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
