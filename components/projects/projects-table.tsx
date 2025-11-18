import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, FileText, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  currentStage: string;
  status: string;
  updatedAt: Date;
  startDate: Date | null;
  lead: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  cluster: {
    name: string;
  };
  _count: {
    documents: number;
    redFlags: number;
    members: number;
  };
}

interface ProjectsTableProps {
  projects: Project[];
}

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PENDING_REVIEW":
      return "bg-yellow-100 text-yellow-800";
    case "ON_HOLD":
      return "bg-gray-100 text-gray-800";
    case "RED_FLAG":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatStage = (stage: string) => {
  switch (stage) {
    case "STAGE_0":
      return "Stage 0";
    case "STAGE_1":
      return "Stage 1";
    case "STAGE_2":
      return "Stage 2";
    case "STAGE_3":
      return "Stage 3";
    default:
      return stage;
  }
};

const formatStatus = (status: string) => {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export function ProjectsTable({ projects }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No projects found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cluster
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {project.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {project.name}
                          </div>
                          {project._count.redFlags > 0 && (
                            <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.projectId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.cluster.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStageColor(project.currentStage)}>
                      {formatStage(project.currentStage)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(project.status)}>
                      {formatStatus(project.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.lead.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {project.lead.name?.charAt(0) ||
                            project.lead.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-2">
                        <div className="text-sm text-gray-900">
                          {project.lead.name || project.lead.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(project.updatedAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link href={`/projects/${project.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/projects/${project.id}/documents`}>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Docs
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{projects.length}</span> of{" "}
                <span className="font-medium">{projects.length}</span> results
              </p>
            </div>
            {/* Add pagination controls here if needed */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
