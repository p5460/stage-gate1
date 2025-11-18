"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getComments } from "@/actions/comments";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
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

export function RecentComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentComments();
  }, []);

  const loadRecentComments = async () => {
    setLoading(true);
    const result = await getComments(); // Get all comments across projects
    if (result.success) {
      // Take the 5 most recent comments
      setComments((result.comments as Comment[]).slice(0, 5));
    }
    setLoading(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <MessageCircle className="h-4 w-4 mr-2" />
          Recent Comments
        </CardTitle>
        <Link href="/projects">
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
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent comments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.image || ""} />
                  <AvatarFallback>
                    {comment.author.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {comment.author.name || "Unknown User"}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {comment.author.role}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {truncateContent(comment.content)}
                  </p>
                  {comment.project && (
                    <Link
                      href={`/projects/${comment.project.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {comment.project.name}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
