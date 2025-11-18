"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";

interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: Date;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  project: {
    id: string;
    name: string;
    projectId: string;
    cluster: {
      name: string;
    };
    lead: {
      name: string | null;
    };
  };
  raisedBy: {
    name: string | null;
  };
}

interface RedFlagStats {
  status: string;
  severity: string;
  _count: number;
}

interface RedFlagsClientProps {
  redFlags: RedFlag[];
  redFlagStats: RedFlagStats[];
  userRole: string;
}

export function RedFlagsClient({
  redFlags,
  redFlagStats,
  userRole,
}: RedFlagsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Filter red flags based on search and filters
  const filteredRedFlags = redFlags.filter((redFlag) => {
    const matchesSearch =
      redFlag.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      redFlag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      redFlag.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      redFlag.project.projectId
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || redFlag.status === statusFilter;
    const matchesSeverity =
      severityFilter === "all" || redFlag.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "LOW":
        return "bg-blue-100 text-blue-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "MEDIUM":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "LOW":
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Calculate stats
  const openRedFlags = redFlags.filter((rf) => rf.status === "OPEN").length;
  const inProgressRedFlags = redFlags.filter(
    (rf) => rf.status === "IN_PROGRESS"
  ).length;
  const resolvedRedFlags = redFlags.filter(
    (rf) => rf.status === "RESOLVED"
  ).length;
  const criticalRedFlags = redFlags.filter(
    (rf) => rf.severity === "CRITICAL"
  ).length;

  const groupedRedFlags = {
    open: filteredRedFlags.filter((rf) => rf.status === "OPEN"),
    inProgress: filteredRedFlags.filter((rf) => rf.status === "IN_PROGRESS"),
    resolved: filteredRedFlags.filter(
      (rf) => rf.status === "RESOLVED" || rf.status === "CLOSED"
    ),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600">
                  {openRedFlags}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {inProgressRedFlags}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {resolvedRedFlags}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {criticalRedFlags}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search red flags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Red Flags Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Open ({groupedRedFlags.open.length})
          </TabsTrigger>
          <TabsTrigger value="inProgress">
            In Progress ({groupedRedFlags.inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({groupedRedFlags.resolved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {groupedRedFlags.open.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No open red flags found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedRedFlags.open.map((redFlag) => (
                <Card
                  key={redFlag.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getSeverityIcon(redFlag.severity)}
                          <h3 className="text-lg font-semibold">
                            {redFlag.title}
                          </h3>
                          <Badge className={getSeverityColor(redFlag.severity)}>
                            {redFlag.severity}
                          </Badge>
                          <Badge className={getStatusColor(redFlag.status)}>
                            {redFlag.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">
                          {redFlag.description}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>
                            <strong>Project:</strong> {redFlag.project.name} (
                            {redFlag.project.projectId})
                          </div>
                          <div>
                            <strong>Cluster:</strong>{" "}
                            {redFlag.project.cluster.name}
                          </div>
                          <div>
                            <strong>Raised by:</strong> {redFlag.raisedBy.name}
                          </div>
                          <div>
                            <strong>Date:</strong>{" "}
                            {new Date(redFlag.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link href={`/projects/${redFlag.project.id}`}>
                          <Button variant="outline">View Project</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inProgress" className="space-y-4">
          {groupedRedFlags.inProgress.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No red flags in progress.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedRedFlags.inProgress.map((redFlag) => (
                <Card
                  key={redFlag.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getSeverityIcon(redFlag.severity)}
                          <h3 className="text-lg font-semibold">
                            {redFlag.title}
                          </h3>
                          <Badge className={getSeverityColor(redFlag.severity)}>
                            {redFlag.severity}
                          </Badge>
                          <Badge className={getStatusColor(redFlag.status)}>
                            {redFlag.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">
                          {redFlag.description}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>
                            <strong>Project:</strong> {redFlag.project.name} (
                            {redFlag.project.projectId})
                          </div>
                          <div>
                            <strong>Cluster:</strong>{" "}
                            {redFlag.project.cluster.name}
                          </div>
                          <div>
                            <strong>Raised by:</strong> {redFlag.raisedBy.name}
                          </div>
                          <div>
                            <strong>Date:</strong>{" "}
                            {new Date(redFlag.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link href={`/projects/${redFlag.project.id}`}>
                          <Button variant="outline">View Project</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {groupedRedFlags.resolved.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No resolved red flags.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedRedFlags.resolved.map((redFlag) => (
                <Card
                  key={redFlag.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getSeverityIcon(redFlag.severity)}
                          <h3 className="text-lg font-semibold">
                            {redFlag.title}
                          </h3>
                          <Badge className={getSeverityColor(redFlag.severity)}>
                            {redFlag.severity}
                          </Badge>
                          <Badge className={getStatusColor(redFlag.status)}>
                            {redFlag.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">
                          {redFlag.description}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>
                            <strong>Project:</strong> {redFlag.project.name} (
                            {redFlag.project.projectId})
                          </div>
                          <div>
                            <strong>Cluster:</strong>{" "}
                            {redFlag.project.cluster.name}
                          </div>
                          <div>
                            <strong>Raised by:</strong> {redFlag.raisedBy.name}
                          </div>
                          <div>
                            <strong>Date:</strong>{" "}
                            {new Date(redFlag.createdAt).toLocaleDateString()}
                          </div>
                          {redFlag.resolvedAt && (
                            <div>
                              <strong>Resolved:</strong>{" "}
                              {new Date(
                                redFlag.resolvedAt
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link href={`/projects/${redFlag.project.id}`}>
                          <Button variant="outline">View Project</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
