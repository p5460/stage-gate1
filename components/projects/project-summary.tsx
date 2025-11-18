import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ProjectSummaryProps {
  project: {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    businessCase: string | null;
    currentStage: string;
    status: string;
    startDate: Date | null;
    budget: number | null;
    technologyReadiness: string | null;
    ipPotential: string | null;
    duration: number | null;
    lead: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
    cluster: {
      name: string;
    };
    members: Array<{
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
      };
    }>;
  };
}

export function ProjectSummary({ project }: ProjectSummaryProps) {
  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <div className="flex-shrink-0 h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-xl">
              {project.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">{project.name}</h3>
            <p className="text-gray-600">{project.projectId}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Cluster</p>
            <p className="font-medium">{project.cluster.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Project Lead</p>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.lead.image || undefined} />
                <AvatarFallback className="text-xs">
                  {project.lead.name?.charAt(0) ||
                    project.lead.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium">
                {project.lead.name || project.lead.email}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">
              {project.startDate
                ? new Date(project.startDate).toLocaleDateString()
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">
              {project.duration
                ? `${project.duration} months`
                : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Budget</p>
            <p className="font-medium">
              {project.budget
                ? `ZAR ${(project.budget / 1000000).toFixed(1)}M`
                : "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Team Size</p>
            <p className="font-medium">{project.members.length + 1}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Key Metrics
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3 rounded text-center">
              <p className="text-xs text-gray-500">Technology Readiness</p>
              <p className="font-bold text-blue-600">
                {project.technologyReadiness || "TRL-0"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <p className="text-xs text-gray-500">IP Potential</p>
              <p className="font-bold text-green-600">
                {project.ipPotential || "Unknown"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <p className="text-xs text-gray-500">Team Members</p>
              <p className="font-bold text-purple-600">
                {project.members.length}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              Project Description
            </h4>
            <p className="text-gray-600">{project.description}</p>
          </div>
        )}

        {/* Business Case */}
        {project.businessCase && (
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              Business Case
            </h4>
            <p className="text-gray-600">{project.businessCase}</p>
          </div>
        )}

        {/* Recent Updates */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Recent Updates
          </h4>
          <div className="space-y-3">
            {project.activities.slice(0, 3).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📋</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.details ||
                      activity.action.replace(/_/g, " ").toLowerCase()}
                  </p>
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
        </div>
      </CardContent>
    </Card>
  );
}
