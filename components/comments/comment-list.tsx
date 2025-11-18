"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Reply, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getComments, deleteComment } from "@/actions/comments";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type CommentWithReplies = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
  replies: CommentWithReplies[];
  _count: {
    replies: number;
  };
};

interface CommentListProps {
  projectId?: string;
  maxComments?: number;
  showReplies?: boolean;
  onReply?: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
}

export function CommentList({
  projectId,
  maxComments,
  showReplies = true,
  onReply,
  onEdit,
}: CommentListProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    setLoading(true);
    const result = await getComments(projectId);
    if (result.success) {
      const commentsData = result.comments || [];
      setComments(
        maxComments
          ? (commentsData as unknown as CommentWithReplies[]).slice(
              0,
              maxComments
            )
          : (commentsData as unknown as CommentWithReplies[])
      );
    } else {
      toast.error("Failed to load comments");
    }
    setLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const result = await deleteComment(commentId);

    if (result.success) {
      await loadComments();
      toast.success("Comment deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete comment");
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const canEditComment = (comment: CommentWithReplies) => {
    return (
      session?.user?.id === comment.author.id || session?.user?.role === "ADMIN"
    );
  };

  const renderComment = (comment: CommentWithReplies, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-6 mt-3" : "mb-4"}`}>
      <Card className={isReply ? "border-l-2 border-l-blue-200" : ""}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.image || ""} />
                <AvatarFallback>
                  {comment.author.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {comment.author.name || "Unknown User"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {comment.author.role}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                  {comment.updatedAt > comment.createdAt && " (edited)"}
                </span>
              </div>
            </div>

            {canEditComment(comment) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={() => onEdit(comment.id, comment.content)}
                    >
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm whitespace-pre-wrap mb-3">{comment.content}</p>

          {!isReply && (
            <div className="flex items-center space-x-2">
              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(comment.id)}
                  className="text-muted-foreground"
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              )}
              {comment._count.replies > 0 && (
                <span className="text-xs text-muted-foreground">
                  {comment._count.replies}{" "}
                  {comment._count.replies === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading comments...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No comments yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => renderComment(comment))}
    </div>
  );
}
