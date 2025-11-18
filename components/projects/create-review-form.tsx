"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClipboardCheck, Plus } from "lucide-react";
import { toast } from "sonner";

const reviewSchema = z.object({
  stage: z.string().min(1, "Stage is required"),
  reviewerId: z.string().min(1, "Reviewer is required"),
  score: z.number().min(1).max(10).optional(),
  comments: z.string().optional(),
  decision: z.enum(["GO", "RECYCLE", "HOLD", "STOP"]).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface CreateReviewFormProps {
  projectId: string;
  onSuccess?: () => void;
  reviewers?: Array<{ id: string; name: string; email: string }>;
}

export function CreateReviewForm({
  projectId,
  onSuccess,
  reviewers = [],
}: CreateReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  });

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create review");
      }

      toast.success("Review created successfully");
      reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create review");
      console.error("Error creating review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Create Gate Review
          </DialogTitle>
          <DialogDescription>
            Create a new gate review for this project stage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select onValueChange={(value) => setValue("stage", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAGE_0">Stage 0: Concept</SelectItem>
                <SelectItem value="STAGE_1">
                  Stage 1: Research Planning
                </SelectItem>
                <SelectItem value="STAGE_2">Stage 2: Feasibility</SelectItem>
                <SelectItem value="STAGE_3">Stage 3: Maturation</SelectItem>
              </SelectContent>
            </Select>
            {errors.stage && (
              <p className="text-sm text-red-600">{errors.stage.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewerId">Reviewer</Label>
            <Select onValueChange={(value) => setValue("reviewerId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reviewer" />
              </SelectTrigger>
              <SelectContent>
                {reviewers.map((reviewer) => (
                  <SelectItem key={reviewer.id} value={reviewer.id}>
                    {reviewer.name} ({reviewer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reviewerId && (
              <p className="text-sm text-red-600">
                {errors.reviewerId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="score">Score (1-10)</Label>
            <Input
              id="score"
              type="number"
              min="1"
              max="10"
              {...register("score", { valueAsNumber: true })}
              placeholder="Optional score"
            />
            {errors.score && (
              <p className="text-sm text-red-600">{errors.score.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="decision">Decision</Label>
            <Select
              onValueChange={(value) => setValue("decision", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decision (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GO">GO - Proceed to next stage</SelectItem>
                <SelectItem value="RECYCLE">
                  RECYCLE - Rework required
                </SelectItem>
                <SelectItem value="HOLD">HOLD - Pause project</SelectItem>
                <SelectItem value="STOP">STOP - Terminate project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              {...register("comments")}
              placeholder="Review comments and feedback..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
