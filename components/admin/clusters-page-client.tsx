"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  BarChart3,
  Users,
  FolderOpen,
} from "lucide-react";
import { CreateClusterForm } from "@/components/admin/create-cluster-form";
import { ClusterManagement } from "@/components/admin/cluster-management";
import { ClusterAnalytics } from "@/components/admin/cluster-analytics";
import { ClusterBulkOperations } from "@/components/admin/cluster-bulk-operations";
import { ClusterExport } from "@/components/admin/cluster-export";
import { ClusterImport } from "@/components/admin/cluster-import";
import { ClusterHealthMonitor } from "@/components/admin/cluster-health-monitor";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Cluster {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  _count: {
    projects: number;
  };
}

interface ClustersPageClientProps {
  clusters: Cluster[];
}

export function ClustersPageClient({ clusters }: ClustersPageClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "projects" | "recent">("name");
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "health"
  >("overview");
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  // Filter and sort clusters
  const filteredClusters = clusters
    .filter(
      (cluster) =>
        cluster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cluster.description &&
          cluster.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "projects":
          return b._count.projects - a._count.projects;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const totalProjects = clusters.reduce(
    (sum, cluster) => sum + cluster._count.projects,
    0
  );
  const averageProjectsPerCluster =
    clusters.length > 0 ? Math.round(totalProjects / clusters.length) : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-end items-center space-x-2">
        <ClusterImport onSuccess={handleRefresh} />
        <ClusterExport clusters={clusters} />
        <ClusterBulkOperations clusters={clusters} onUpdate={handleRefresh} />
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Cluster
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "analytics" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </Button>
        <Button
          variant={activeTab === "health" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("health")}
        >
          Health Monitor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Clusters</p>
                <p className="text-2xl font-bold">{clusters.length}</p>
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
              <Filter className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active Clusters</p>
                <p className="text-2xl font-bold">
                  {clusters.filter((c) => c._count.projects > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search clusters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="projects">Sort by Projects</option>
          </select>

          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Clusters Display */}
          {filteredClusters.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredClusters.map((cluster) => (
                <Card
                  key={cluster.id}
                  className={viewMode === "list" ? "p-4" : ""}
                >
                  <CardHeader className={viewMode === "list" ? "pb-2" : ""}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: cluster.color || "#3B82F6",
                          }}
                        />
                        <CardTitle
                          className={
                            viewMode === "list" ? "text-base" : "text-lg"
                          }
                        >
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
                          allClusters={clusters}
                          onUpdate={handleRefresh}
                        />
                      </div>
                    </div>
                    {cluster.description && (
                      <CardDescription
                        className={viewMode === "list" ? "text-sm" : ""}
                      >
                        {cluster.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  {viewMode === "grid" && (
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Created: {new Date().toLocaleDateString()}</span>
                        {cluster._count.projects > 0 && (
                          <span className="text-green-600 font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                {searchTerm ? (
                  <div>
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      No clusters found matching "{searchTerm}"
                    </p>
                    <Button variant="outline" onClick={() => setSearchTerm("")}>
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      No clusters found. Create your first cluster to get
                      started.
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Cluster
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search Results Summary */}
          {searchTerm && filteredClusters.length > 0 && (
            <div className="text-sm text-gray-500 text-center">
              Showing {filteredClusters.length} of {clusters.length} clusters
            </div>
          )}
        </>
      )}

      {activeTab === "analytics" && <ClusterAnalytics clusters={clusters} />}

      {activeTab === "health" && <ClusterHealthMonitor clusters={clusters} />}

      <CreateClusterForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
      />
    </div>
  );
}
