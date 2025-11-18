"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRedFlags } from "@/actions/red-flags";
import Link from "next/link";

interface RedFlag {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: Date;
  raisedBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
  project?: {
    id: string;
    name: string;
    projectId: string;
  };
}

export function RecentRedFlags() {
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentRedFlags();
  }, []);

  const loadRecentRedFlags = async () => {
    setLoading(true);
    const result = await getRedFlags(); // Get all red flags
    if (result.success) {
      // Take the 5 most recent red flags
      setRedFlags((result.redFlags as RedFlag[]).slice(0, 5));
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
          Recent Red Flags
        </CardTitle>
        <Link href="/red-flags">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : redFlags.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent red flags</p>
          </div>
        ) : (
          <div className="space-y-4">
            {redFlags.map((redFlag) => (
              <div
                key={redFlag.id}
                className="border-l-4 border-l-red-500 pl-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {redFlag.title}
                  </h4>
                  <div className="flex items-center space-x-1 ml-2">
                    <Badge
                      className={`text-xs ${getSeverityColor(redFlag.severity)}`}
                    >
                      {redFlag.severity}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={redFlag.raisedBy.image || ""} />
                    <AvatarFallback className="text-xs">
                      {redFlag.raisedBy.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-600">
                    {redFlag.raisedBy.name || "Unknown"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(redFlag.createdAt)}
                  </span>
                </div>

                {redFlag.project && (
                  <Link
                    href={`/projects/${redFlag.project.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {redFlag.project.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
