"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Reply, Edit, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  createComment,
  updateComment,
  deleteComment,
  getComments,
  exportComments,
} from "@/actions/comments";
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

interface CommentSectionProps {
  projectId?: string;
  title?: string;
  showExport?: boolean;
}

export function CommentSection({
  projectId,
  title = "Comments",
  showExport = true,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    setLoading(true);
    const result = await getComments(projectId);
    if (result.success) {
      setComments((result.comments as unknown as CommentWithReplies[]) || []);
    } else {
      toast.error("Failed to load comments");
    }
    setLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    const result = await createComment(newComment, projectId);

    if (result.success) {
      setNewComment("");
      await loadComments();
      toast.success("Comment added successfully");
    } else {
      toast.error(result.error || "Failed to add comment");
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    const result = await createComment(replyContent, projectId, parentId);

    if (result.success) {
      setReplyContent("");
      setReplyingTo(null);
      await loadComments();
      toast.success("Reply added successfully");
    } else {
      toast.error(result.error || "Failed to add reply");
    }
    setSubmitting(false);
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    setSubmitting(true);
    const result = await updateComment(commentId, editContent);

    if (result.success) {
      setEditContent("");
      setEditingComment(null);
      await loadComments();
      toast.success("Comment updated successfully");
    } else {
      toast.error(result.error || "Failed to update comment");
    }
    setSubmitting(false);
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

  const handleExportComments = async (format: "json" | "csv") => {
    if (!projectId) {
      toast.error("No project ID provided for export");
      return;
    }

    try {
      console.log("Export comments clicked:", format, "projectId:", projectId);
      toast.info(`Exporting comments as ${format.toUpperCase()}...`);

      const result = await exportComments(projectId, format);
      console.log("Export result:", result);

      if (result.success) {
        // Create and download file
        const blob = new Blob([result.data], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`Comments exported as ${format.toUpperCase()}`);
      } else {
        console.error("Export failed:", result.error);
        toast.error(result.error || "Failed to export comments");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An error occurred while exporting comments");
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
    <div key={comment.id} className={`${isReply ? "ml-8 mt-4" : "mb-6"}`}>
      <Card>
        <CardHeader className="pb-3">
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
                    •••
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      console.log("Edit comment clicked:", comment.id);
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                      toast.info("Editing comment...");
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {editingComment === comment.id ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                className="min-h-[80px]"
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleEditComment(comment.id)}
                  disabled={submitting}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap mb-3">
                {comment.content}
              </p>

              {!isReply && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-muted-foreground"
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  {comment._count.replies > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {comment._count.replies}{" "}
                      {comment._count.replies === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reply form */}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-4">
          <Card>
            <CardContent className="pt-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[80px] mb-3"
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={submitting || !replyContent.trim()}
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to view and add comments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>

        {showExport && projectId && comments.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportComments("json")}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportComments("csv")}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Separator />

      {/* New comment form */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user?.image || ""} />
              <AvatarFallback>
                {session.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px]"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
