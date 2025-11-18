"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Search,
  Filter,
  Download,
  FileText,
  Presentation,
  Calendar,
  User,
  FolderOpen,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ActivityData {
  id: string;
  action: string;
  details: string | null;
  metadata: any;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
  project?: {
    id: string;
    name: string;
    projectId: string;
    status: string;
    currentStage: string;
  } | null;
}

interface ActivityStats {
  action: string;
  _count: number;
}

interface ActivityClientProps {
  activities: ActivityData[];
  activityStats: ActivityStats[];
  userRole: string;
}

export function ActivityClient({
  activities,
  activityStats,
  userRole,
}: ActivityClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  // Filter activities based on search and filters
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        searchTerm === "" ||
        (activity.details &&
          activity.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.user.name &&
          activity.user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (activity.project?.name &&
          activity.project.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesAction =
        actionFilter === "all" || activity.action === actionFilter;

      const matchesUser =
        userFilter === "all" || activity.user.id === userFilter;

      const matchesDate = (() => {
        if (dateFilter === "all") return true;
        const activityDate = new Date(activity.createdAt);
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (dateFilter) {
          case "today":
            return daysDiff === 0;
          case "week":
            return daysDiff <= 7;
          case "month":
            return daysDiff <= 30;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesAction && matchesUser && matchesDate;
    });
  }, [activities, searchTerm, actionFilter, userFilter, dateFilter]);

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    const users = activities.reduce(
      (acc, activity) => {
        if (!acc.find((u) => u.id === activity.user.id)) {
          acc.push(activity.user);
        }
        return acc;
      },
      [] as ActivityData["user"][]
    );
    return users;
  }, [activities]);

  // Get unique actions for filter
  const uniqueActions = useMemo(() => {
    return [...new Set(activities.map((a) => a.action))];
  }, [activities]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "PROJECT_CREATED":
        return "bg-green-100 text-green-800";
      case "PROJECT_UPDATED":
        return "bg-blue-100 text-blue-800";
      case "PROJECT_DELETED":
        return "bg-red-100 text-red-800";
      case "REVIEW_CREATED":
        return "bg-purple-100 text-purple-800";
      case "REVIEW_COMPLETED":
        return "bg-indigo-100 text-indigo-800";
      case "USER_LOGIN":
        return "bg-gray-100 text-gray-800";
      case "DOCUMENT_UPLOADED":
        return "bg-yellow-100 text-yellow-800";
      case "MILESTONE_COMPLETED":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "GATEKEEPER":
        return "bg-purple-100 text-purple-800";
      case "PROJECT_LEAD":
        return "bg-blue-100 text-blue-800";
      case "RESEARCHER":
        return "bg-green-100 text-green-800";
      case "REVIEWER":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportActivities = async (exportFormat: "pdf" | "pptx") => {
    setExporting(true);
    try {
      const response = await fetch("/api/activity/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: exportFormat,
          activities: filteredActivities,
          stats: activityStats,
          filters: {
            searchTerm,
            actionFilter,
            userFilter,
            dateFilter,
          },
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `activity-report-${exportFormat === "pdf" ? "pdf" : "pptx"}-${format(
          new Date(),
          "yyyy-MM-dd"
        )}.${exportFormat === "pdf" ? "pdf" : "pptx"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(
          `Activity report exported as ${exportFormat.toUpperCase()}`
        );
      } else {
        toast.error("Failed to export activity report");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Error exporting activity report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Activities
                </p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold">{uniqueUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Projects Involved
                </p>
                <p className="text-2xl font-bold">
                  {
                    new Set(
                      activities
                        .filter((a) => a.project)
                        .map((a) => a.project!.id)
                    ).size
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Most Recent</p>
                <p className="text-sm font-bold">
                  {activities.length > 0
                    ? format(new Date(activities[0].createdAt), "MMM dd, HH:mm")
                    : "No activities"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                View and filter all system activities
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => exportActivities("pdf")}
                disabled={exporting}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                onClick={() => exportActivities("pptx")}
                disabled={exporting}
                variant="outline"
                size="sm"
              >
                <Presentation className="h-4 w-4 mr-2" />
                Export PowerPoint
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">Activity List</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No activities found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <Badge className={getActionColor(activity.action)}>
                              {activity.action.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div
                              className="truncate"
                              title={activity.details || "No details available"}
                            >
                              {activity.details || "No details available"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {activity.user.name || "Unknown User"}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRoleColor(
                                  activity.user.role
                                )}`}
                              >
                                {activity.user.role.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {activity.project ? (
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {activity.project.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {activity.project.projectId}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>
                                {format(
                                  new Date(activity.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(activity.createdAt), "HH:mm")}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activityStats.map((stat) => (
                        <div
                          key={stat.action}
                          className="flex items-center justify-between"
                        >
                          <Badge className={getActionColor(stat.action)}>
                            {stat.action.replace(/_/g, " ")}
                          </Badge>
                          <span className="font-semibold">{stat._count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {uniqueUsers.slice(0, 10).map((user) => {
                        const userActivityCount = activities.filter(
                          (a) => a.user.id === user.id
                        ).length;
                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRoleColor(user.role)}`}
                              >
                                {user.role.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <Badge variant="outline">
                              {userActivityCount} activities
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
