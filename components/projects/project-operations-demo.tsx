"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Edit,
  Download,
  Settings,
  Users,
  DollarSign,
  Flag,
  Copy,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

// Import all the project management components
import { EditProjectForm } from "./edit-project-form";
import { ExportProjects } from "./export-projects";
import { ProjectManagement } from "./project-management";
import { ProjectActions } from "./project-actions";
import { ComprehensiveEditProject } from "./comprehensive-edit-project";

// Mock data for demonstration
const mockProject = {
  id: "proj-1",
  projectId: "STP-0001",
  name: "Advanced AI Research Project",
  description:
    "Developing next-generation AI algorithms for industrial applications",
  businessCase:
    "This project aims to create competitive advantage through AI innovation",
  currentStage: "STAGE_2",
  status: "ACTIVE",
  budget: 2500000,
  budgetUtilization: 45,
  duration: 24,
  technologyReadiness: "TRL-4",
  ipPotential: "High",
  startDate: new Date("2024-01-15"),
  endDate: new Date("2025-12-31"),
  lead: {
    id: "user-1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@company.com",
  },
  cluster: {
    id: "cluster-1",
    name: "Artificial Intelligence",
  },
  members: [
    {
      id: "member-1",
      user: {
        id: "user-2",
        name: "John Smith",
        email: "john.smith@company.com",
      },
      role: "RESEARCHER",
    },
    {
      id: "member-2",
      user: {
        id: "user-3",
        name: "Emily Chen",
        email: "emily.chen@company.com",
      },
      role: "TECHNICAL_LEAD",
    },
  ],
  _count: {
    documents: 15,
    redFlags: 1,
    gateReviews: 3,
    members: 2,
    comments: 28,
  },
};

const mockClusters = [
  { id: "cluster-1", name: "Artificial Intelligence" },
  { id: "cluster-2", name: "Renewable Energy" },
  { id: "cluster-3", name: "Biotechnology" },
];

const mockUsers = [
  {
    id: "user-1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "PROJECT_LEAD",
  },
  {
    id: "user-2",
    name: "John Smith",
    email: "john.smith@company.com",
    role: "RESEARCHER",
  },
  {
    id: "user-3",
    name: "Emily Chen",
    email: "emily.chen@company.com",
    role: "RESEARCHER",
  },
  {
    id: "user-4",
    name: "Michael Brown",
    email: "michael.brown@company.com",
    role: "ADMIN",
  },
  {
    id: "user-5",
    name: "Lisa Wilson",
    email: "lisa.wilson@company.com",
    role: "GATEKEEPER",
  },
];

export function ProjectOperationsDemo() {
  const [currentUserId] = useState("user-1"); // Simulating current user as project lead
  const [currentUserRole] = useState("PROJECT_LEAD");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = () => {
    setRefreshKey((prev) => prev + 1);
    console.log("Project updated - refreshing data...");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "ON_HOLD":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "TERMINATED":
        return "bg-gray-100 text-gray-800";
      case "RED_FLAG":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          Project Editing & Export Functions
        </h1>
        <p className="text-gray-600">
          Comprehensive demonstration of all project management capabilities
        </p>
      </div>

      {/* Project Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{mockProject.name}</span>
                <Badge variant="outline">{mockProject.projectId}</Badge>
                <Badge className={getStatusColor(mockProject.status)}>
                  {mockProject.status}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {mockProject.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <ProjectManagement
                project={mockProject as any}
                clusters={mockClusters}
                users={mockUsers}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Project Details</h4>
              <div className="text-sm space-y-1">
                <div>
                  Stage: {mockProject.currentStage.replace("STAGE_", "Stage ")}
                </div>
                <div>Lead: {mockProject.lead.name}</div>
                <div>Cluster: {mockProject.cluster.name}</div>
                <div>Duration: {mockProject.duration} months</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Budget Information</h4>
              <div className="text-sm space-y-1">
                <div>Total: R{mockProject.budget?.toLocaleString()}</div>
                <div>Utilized: {mockProject.budgetUtilization}%</div>
                <div>
                  Spent: R
                  {(
                    ((mockProject.budget || 0) *
                      (mockProject.budgetUtilization || 0)) /
                    100
                  ).toLocaleString()}
                </div>
                <div>
                  Remaining: R
                  {(
                    (mockProject.budget || 0) -
                    ((mockProject.budget || 0) *
                      (mockProject.budgetUtilization || 0)) /
                      100
                  ).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Activity Summary</h4>
              <div className="text-sm space-y-1">
                <div>Documents: {mockProject._count.documents}</div>
                <div>Red Flags: {mockProject._count.redFlags}</div>
                <div>Gate Reviews: {mockProject._count.gateReviews}</div>
                <div>Team Members: {mockProject._count.members + 1}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Available Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primary Actions */}
            <div>
              <h4 className="font-medium mb-3">Primary Actions</h4>
              <div className="flex flex-wrap gap-2">
                <EditProjectForm
                  project={mockProject as any}
                  clusters={mockClusters as any}
                  users={mockUsers as any}
                  currentUser={
                    { id: currentUserId, role: currentUserRole } as any
                  }
                />

                <ComprehensiveEditProject
                  project={mockProject}
                  clusters={mockClusters}
                  users={mockUsers}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onSuccess={handleUpdate}
                />

                <ExportProjects
                  projects={[mockProject]}
                  singleProject={mockProject}
                />

                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Bulk Export
                </Button>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div>
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <ProjectActions
                project={mockProject}
                users={mockUsers}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onUpdate={handleUpdate}
              />
            </div>

            <Separator />

            {/* Management Actions */}
            <div>
              <h4 className="font-medium mb-3">Management Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Project
                </Button>

                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>

                <Button variant="outline" size="sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Budget Review
                </Button>

                <Button variant="outline" size="sm">
                  <Flag className="h-4 w-4 mr-2" />
                  View Red Flags
                </Button>

                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Editing Functions
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  • Update project details (name, description, business case)
                </li>
                <li>• Modify budget and utilization tracking</li>
                <li>• Change project status and stage</li>
                <li>• Transfer project leadership</li>
                <li>• Add/remove team members</li>
                <li>• Update timeline and milestones</li>
                <li>• Manage technology readiness and IP potential</li>
                <li>• Comprehensive tabbed editing interface</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export Functions
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Single project export (JSON/CSV)</li>
                <li>• Bulk project export</li>
                <li>• Comprehensive data export with relationships</li>
                <li>• Customizable export formats</li>
                <li>• Include/exclude detailed information</li>
                <li>• Activity logs and audit trails</li>
                <li>• Team member and role information</li>
                <li>• Budget and financial data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Permission System</h4>
              <p>All functions respect user roles and permissions:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>ADMIN:</strong> Full access to all projects and
                  functions
                </li>
                <li>
                  <strong>GATEKEEPER:</strong> Can edit and manage most project
                  aspects
                </li>
                <li>
                  <strong>PROJECT_LEAD:</strong> Full control over their own
                  projects
                </li>
                <li>
                  <strong>TEAM_MEMBER:</strong> Limited access based on project
                  membership
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Data Validation</h4>
              <p>All editing functions include comprehensive validation:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Budget values must be positive numbers</li>
                <li>Utilization percentage must be between 0-100%</li>
                <li>Required fields are validated before submission</li>
                <li>Date ranges are validated for logical consistency</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Activity Logging</h4>
              <p>All changes are automatically logged for audit purposes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Project updates and modifications</li>
                <li>Team member additions and removals</li>
                <li>Status changes and transfers</li>
                <li>Export activities and data access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
