"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  FolderOpen,
  ArrowRight,
  BarChart3,
  Settings,
  Palette,
} from "lucide-react";

// Import all the cluster management components
import { CreateClusterForm } from "./create-cluster-form";
import { EditClusterForm } from "./edit-cluster-form";
import { ClusterManagement } from "./cluster-management";
import { ClusterDetails } from "./cluster-details";

// Mock data for demonstration
const mockClusters = [
  {
    id: "cluster-1",
    name: "Artificial Intelligence",
    description:
      "AI and machine learning research projects focusing on industrial applications and automation",
    color: "#3B82F6",
    _count: { projects: 8 },
  },
  {
    id: "cluster-2",
    name: "Renewable Energy",
    description:
      "Sustainable energy solutions including solar, wind, and battery technologies",
    color: "#10B981",
    _count: { projects: 12 },
  },
  {
    id: "cluster-3",
    name: "Biotechnology",
    description: "Biomedical research and pharmaceutical development projects",
    color: "#8B5CF6",
    _count: { projects: 6 },
  },
  {
    id: "cluster-4",
    name: "Smart Manufacturing",
    description:
      "Industry 4.0 initiatives and advanced manufacturing technologies",
    color: "#F59E0B",
    _count: { projects: 15 },
  },
  {
    id: "cluster-5",
    name: "Digital Health",
    description: "Healthcare technology and digital wellness solutions",
    color: "#EF4444",
    _count: { projects: 4 },
  },
  {
    id: "cluster-6",
    name: "Quantum Computing",
    description: "Quantum research and computational advancement projects",
    color: "#06B6D4",
    _count: { projects: 0 },
  },
];

export function ClusterOperationsDemo() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = () => {
    setRefreshKey((prev) => prev + 1);
    console.log("Clusters updated - refreshing data...");
  };

  const totalProjects = mockClusters.reduce(
    (sum, cluster) => sum + cluster._count.projects,
    0
  );
  const activeClusters = mockClusters.filter(
    (c) => c._count.projects > 0
  ).length;
  const averageProjectsPerCluster =
    mockClusters.length > 0
      ? Math.round(totalProjects / mockClusters.length)
      : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Cluster Management Functions</h1>
        <p className="text-gray-600">
          Comprehensive demonstration of cluster editing and deletion
          capabilities
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Clusters</p>
                <p className="text-2xl font-bold">{mockClusters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Projects/Cluster</p>
                <p className="text-2xl font-bold">
                  {averageProjectsPerCluster}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active Clusters</p>
                <p className="text-2xl font-bold">{activeClusters}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Actions */}
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
                <CreateClusterForm open={false} onOpenChange={() => {}} />

                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>

                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Bulk Operations
                </Button>
              </div>
            </div>

            <Separator />

            {/* Individual Cluster Actions */}
            <div>
              <h4 className="font-medium mb-3">Individual Cluster Actions</h4>
              <p className="text-sm text-gray-600 mb-3">
                Each cluster card includes a dropdown menu with the following
                actions:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span>Edit cluster details</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span>View cluster details</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4 text-purple-600" />
                  <span>View projects</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-orange-600" />
                  <span>Reassign projects</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-pink-600" />
                  <span>Change color</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span>Delete cluster</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cluster Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Cluster Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockClusters.map((cluster) => (
              <Card key={cluster.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cluster.color }}
                      />
                      <CardTitle className="text-base">
                        {cluster.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {cluster._count.projects} project
                        {cluster._count.projects !== 1 ? "s" : ""}
                      </Badge>
                      <ClusterManagement
                        cluster={cluster}
                        allClusters={mockClusters}
                        onUpdate={handleUpdate}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{cluster.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <EditClusterForm
                        cluster={cluster}
                        onSuccess={handleUpdate}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        }
                      />
                      <ClusterDetails
                        cluster={cluster}
                        allClusters={mockClusters}
                        onUpdate={handleUpdate}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        }
                      />
                    </div>
                    {cluster._count.projects > 0 && (
                      <span className="text-green-600 font-medium">Active</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <li>• Update cluster name and description</li>
                <li>• Change cluster color with color picker</li>
                <li>• Real-time preview of changes</li>
                <li>• Validation for duplicate names</li>
                <li>• Form reset on cancel</li>
                <li>• Success/error feedback</li>
                <li>• Activity logging for audit trails</li>
                <li>• Permission-based access control</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletion Functions
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Safe deletion with project checks</li>
                <li>• Project reassignment before deletion</li>
                <li>• Bulk project reassignment</li>
                <li>• Selective project reassignment</li>
                <li>• Confirmation dialogs with warnings</li>
                <li>• Force delete prevention for safety</li>
                <li>• Activity logging for deletions</li>
                <li>• Admin-only deletion permissions</li>
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
              <p>Cluster management respects user roles and permissions:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>ADMIN:</strong> Full access to all cluster operations
                  including deletion
                </li>
                <li>
                  <strong>GATEKEEPER:</strong> Can create, edit, and reassign
                  projects between clusters
                </li>
                <li>
                  <strong>Other Roles:</strong> Read-only access to cluster
                  information
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">Data Safety</h4>
              <p>Multiple safety measures are implemented:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Cannot delete clusters with active projects</li>
                <li>Project reassignment required before deletion</li>
                <li>Confirmation dialogs for destructive actions</li>
                <li>Activity logging for all changes</li>
                <li>Validation for duplicate cluster names</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">User Experience</h4>
              <p>Enhanced UX features include:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Real-time color preview in edit forms</li>
                <li>Comprehensive cluster details view</li>
                <li>Project statistics and distribution charts</li>
                <li>Search and filtering capabilities</li>
                <li>Grid and list view modes</li>
                <li>Responsive design for all screen sizes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
