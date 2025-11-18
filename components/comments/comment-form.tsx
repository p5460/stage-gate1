"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createComment } from "@/actions/comments";
import { toast } from "sonner";

interface CommentFormProps {
  projectId?: string;
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function CommentForm({
  projectId,
  parentId,
  placeholder = "Write a comment...",
  onSuccess,
  onCancel,
  showCancel = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    startTransition(async () => {
      const result = await createComment(content, projectId, parentId);

      if (result.success) {
        toast.success(
          parentId ? "Reply added successfully!" : "Comment added successfully!"
        );
        setContent("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to add comment");
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px]"
            disabled={isPending}
          />

          <div className="flex space-x-2">
            <Button type="submit" disabled={isPending || !content.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <MessageCircle className="mr-2 h-4 w-4" />
              {parentId ? "Reply" : "Comment"}
            </Button>

            {showCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
