"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  Server,
  Database,
  Mail,
  FileText,
  Shield,
  Zap,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface SystemComponent {
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  description: string;
  lastUpdated: Date;
  uptime: number;
  responseTime?: number;
  icon: React.ComponentType<any>;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "low" | "medium" | "high" | "critical";
  startTime: Date;
  endTime?: Date;
  affectedComponents: string[];
  updates: {
    timestamp: Date;
    message: string;
    status: string;
  }[];
}

interface Metric {
  name: string;
  value: string;
  change: number;
  trend: "up" | "down" | "stable";
  description: string;
}

export function SystemStatus() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const systemComponents: SystemComponent[] = [
    {
      id: "platform",
      name: "Platform Core",
      status: "operational",
      description: "Main application and user interface",
      lastUpdated: new Date(),
      uptime: 99.9,
      responseTime: 245,
      icon: Server,
    },
    {
      id: "database",
      name: "Database",
      status: "operational",
      description: "Primary database and data storage",
      lastUpdated: new Date(),
      uptime: 99.8,
      responseTime: 12,
      icon: Database,
    },
    {
      id: "sharepoint",
      name: "SharePoint Integration",
      status: "operational",
      description: "Document storage and management",
      lastUpdated: new Date(),
      uptime: 99.5,
      responseTime: 890,
      icon: FileText,
    },
    {
      id: "email",
      name: "Email Notifications",
      status: "operational",
      description: "Email delivery and notification system",
      lastUpdated: new Date(),
      uptime: 99.7,
      responseTime: 1200,
      icon: Mail,
    },
    {
      id: "auth",
      name: "Authentication",
      status: "operational",
      description: "User authentication and authorization",
      lastUpdated: new Date(),
      uptime: 99.9,
      responseTime: 156,
      icon: Shield,
    },
    {
      id: "api",
      name: "API Services",
      status: "degraded",
      description: "REST API and integration endpoints",
      lastUpdated: new Date(Date.now() - 15 * 60 * 1000),
      uptime: 98.2,
      responseTime: 2100,
      icon: Zap,
    },
  ];

  const incidents: Incident[] = [
    {
      id: "inc-001",
      title: "API Response Time Degradation",
      description:
        "Some API endpoints are experiencing slower than normal response times",
      status: "monitoring",
      severity: "medium",
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      affectedComponents: ["api"],
      updates: [
        {
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          message: "We have identified the cause and are implementing a fix",
          status: "identified",
        },
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          message: "We are investigating reports of slower API response times",
          status: "investigating",
        },
      ],
    },
  ];

  const metrics: Metric[] = [
    {
      name: "Overall Uptime",
      value: "99.7%",
      change: 0.1,
      trend: "up",
      description: "System availability over the last 30 days",
    },
    {
      name: "Average Response Time",
      value: "267ms",
      change: -15,
      trend: "up",
      description: "Average API response time",
    },
    {
      name: "Active Users",
      value: "1,247",
      change: 8.3,
      trend: "up",
      description: "Currently active users on the platform",
    },
    {
      name: "Error Rate",
      value: "0.03%",
      change: -0.01,
      trend: "up",
      description: "Error rate over the last 24 hours",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "degraded":
        return "bg-yellow-100 text-yellow-800";
      case "outage":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "maintenance":
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  const overallStatus = systemComponents.every(
    (c) => c.status === "operational"
  )
    ? "operational"
    : systemComponents.some((c) => c.status === "outage")
      ? "outage"
      : "degraded";

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon(overallStatus)}
              <div>
                <h2 className="text-xl font-semibold">
                  {overallStatus === "operational"
                    ? "All Systems Operational"
                    : overallStatus === "degraded"
                      ? "Some Systems Degraded"
                      : "System Outage"}
                </h2>
                <p className="text-gray-600">
                  Last updated: {lastRefresh.toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <div className="ml-2">
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : metric.trend === "down" ? (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                  </div>
                </div>
                <h3 className="font-medium">{metric.name}</h3>
                <p className="text-sm text-gray-600">{metric.description}</p>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className={
                      metric.change > 0
                        ? "text-green-700 border-green-200"
                        : metric.change < 0
                          ? "text-red-700 border-red-200"
                          : "text-gray-700 border-gray-200"
                    }
                  >
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Components */}
      <Card>
        <CardHeader>
          <CardTitle>System Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemComponents.map((component) => (
              <div
                key={component.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <component.icon className="h-6 w-6 text-gray-600" />
                  <div>
                    <h3 className="font-medium">{component.name}</h3>
                    <p className="text-sm text-gray-600">
                      {component.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {component.uptime}% uptime
                    </div>
                    {component.responseTime && (
                      <div className="text-gray-600">
                        {component.responseTime}ms avg
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(component.status)}>
                    {component.status}
                  </Badge>
                  {getStatusIcon(component.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Incidents */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {incidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{incident.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {incident.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                      <Badge variant="outline">{incident.status}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Started: {incident.startTime.toLocaleString()}
                    {incident.endTime && (
                      <span>
                        {" "}
                        • Resolved: {incident.endTime.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Updates:</h4>
                    {incident.updates.map((update, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div>
                          <div className="text-sm">
                            <span className="font-medium">
                              {update.timestamp.toLocaleString()}
                            </span>
                            <span className="ml-2 text-gray-600">
                              {update.message}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No scheduled maintenance at this time
            </p>
            <p className="text-sm text-gray-400 mt-2">
              We'll notify users in advance of any planned maintenance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Historical Data */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.8%</div>
              <div className="font-medium">30-day uptime</div>
              <div className="text-sm text-gray-600">Last 30 days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">99.5%</div>
              <div className="font-medium">90-day uptime</div>
              <div className="text-sm text-gray-600">Last 90 days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">99.7%</div>
              <div className="font-medium">1-year uptime</div>
              <div className="text-sm text-gray-600">Last 365 days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Report an Issue</h4>
              <p className="text-sm text-gray-600 mb-3">
                If you're experiencing issues not listed here, please contact
                our support team.
              </p>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
            <div>
              <h4 className="font-medium mb-2">Status Updates</h4>
              <p className="text-sm text-gray-600 mb-3">
                Subscribe to receive notifications about system status changes
                and maintenance.
              </p>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Subscribe to Updates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
