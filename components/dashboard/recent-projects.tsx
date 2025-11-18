import Link from "next/link";

interface Project {
  id: string;
  projectId: string;
  name: string;
  currentStage: string;
  status: string;
  updatedAt: Date;
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
  };
}

interface RecentProjectsProps {
  projects: Project[];
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case "STAGE_0":
      return "px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800";
    case "STAGE_1":
      return "px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800";
    case "STAGE_2":
      return "px-2 py-1 text-xs rounded-full bg-green-100 text-green-800";
    case "STAGE_3":
      return "px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800";
    default:
      return "px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "px-2 py-1 text-xs rounded-full bg-green-100 text-green-800";
    case "PENDING_REVIEW":
      return "px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800";
    case "ON_HOLD":
      return "px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800";
    case "RED_FLAG":
      return "px-2 py-1 text-xs rounded-full bg-red-100 text-red-800";
    default:
      return "px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800";
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

export function RecentProjects({ projects }: RecentProjectsProps) {
  // Default projects if none provided
  const defaultProjects = [
    {
      id: "1",
      projectId: "#STP-5678",
      name: "Smart Water Meter",
      currentStage: "STAGE_1",
      status: "ACTIVE",
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      lead: { name: "Dr. Sarah Johnson", email: null, image: null },
      cluster: { name: "Smart Places" },
      _count: { documents: 5, redFlags: 0 },
    },
    {
      id: "2",
      projectId: "#STP-3456",
      name: "Urban Traffic AI",
      currentStage: "STAGE_0",
      status: "PENDING_REVIEW",
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      lead: { name: "Dr. John Smith", email: null, image: null },
      cluster: { name: "Smart Places" },
      _count: { documents: 3, redFlags: 0 },
    },
    {
      id: "3",
      projectId: "#STP-7890",
      name: "Waste Mgmt Sensors",
      currentStage: "STAGE_2",
      status: "RED_FLAG",
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      lead: { name: "Dr. Linda Williams", email: null, image: null },
      cluster: { name: "Smart Places" },
      _count: { documents: 8, redFlags: 1 },
    },
  ];

  const displayProjects = projects.length > 0 ? projects : defaultProjects;

  return (
    <div className="p-6 bg-white rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Recently Updated Projects
        </h2>
        <Link
          href="/projects"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Project
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Cluster
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Stage
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Last Updated
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayProjects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">TD</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {project.name}
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
                  <span className={getStageColor(project.currentStage)}>
                    {formatStage(project.currentStage)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusColor(project.status)}>
                    {formatStatus(project.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2 hours ago
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </Link>
                  <Link
                    href={`/projects/${project.id}/review`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
