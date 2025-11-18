import { formatDistanceToNow } from "date-fns";
import {
  Check,
  Upload,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  ChevronRight,
} from "lucide-react";

interface Activity {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
  project: {
    name: string;
    projectId: string;
  } | null;
}

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case "PROJECT_CREATED":
    case "STAGE_ADVANCED":
      return Check;
    case "DOCUMENT_UPLOADED":
      return Upload;
    case "GATE_REVIEWED":
      return ClipboardCheck;
    case "RED_FLAG_RAISED":
      return AlertTriangle;
    case "PROJECT_UPDATED":
      return ArrowRight;
    default:
      return Info;
  }
};

const getActivityColor = (action: string) => {
  switch (action) {
    case "PROJECT_CREATED":
    case "STAGE_ADVANCED":
      return "bg-blue-100 text-blue-600";
    case "DOCUMENT_UPLOADED":
      return "bg-green-100 text-green-600";
    case "GATE_REVIEWED":
      return "bg-purple-100 text-purple-600";
    case "RED_FLAG_RAISED":
      return "bg-yellow-100 text-yellow-600";
    case "PROJECT_UPDATED":
      return "bg-purple-100 text-purple-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export function RecentActivity({ activities }: RecentActivityProps) {
  // Default activities if none provided
  const defaultActivities = [
    {
      id: "1",
      action: "STAGE_ADVANCED",
      details: "Project #123 moved to Stage 2",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      user: { name: "Dr. Sarah Johnson", email: null },
      project: { name: "Smart Water Meter", projectId: "#123" },
    },
    {
      id: "2",
      action: "RED_FLAG_RAISED",
      details: "Red flag raised on Project #789",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      user: { name: "Prof. Mike Brown", email: null },
      project: { name: "Urban Traffic AI", projectId: "#789" },
    },
    {
      id: "3",
      action: "DOCUMENT_UPLOADED",
      details: "New document added to Project #456",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      user: { name: "Dr. Linda Williams", email: null },
      project: { name: "Waste Management", projectId: "#456" },
    },
    {
      id: "4",
      action: "GATE_REVIEWED",
      details: "Gate review completed for Project #101",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      user: { name: "Dr. John Smith", email: null },
      project: { name: "Energy Monitor", projectId: "#101" },
    },
  ];

  const displayActivities =
    activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="flex items-start">
            <div
              className={`flex-shrink-0 p-2 rounded-full ${getActivityColor(
                activity.action
              )}`}
            >
              {(() => {
                const IconComponent = getActivityIcon(activity.action);
                return <IconComponent className="h-4 w-4" />;
              })()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{activity.details}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}{" "}
                by {activity.user.name || activity.user.email}
              </p>
            </div>
          </div>
        ))}
      </div>
      <a
        href="#"
        className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        View all activity
        <ChevronRight className="ml-1 h-4 w-4" />
      </a>
    </div>
  );
}
