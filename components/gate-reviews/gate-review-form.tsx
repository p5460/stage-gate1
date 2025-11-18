"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateGateReview } from "@/actions/gate-reviews";
import { toast } from "sonner";

const gateReviewSchema = z.object({
  decision: z.enum(["GO", "RECYCLE", "HOLD", "STOP"], {
    message: "Please select a decision",
  }),
  score: z.number().min(0).max(10).optional(),
  comments: z.string().min(10, "Comments must be at least 10 characters"),
});

type GateReviewFormData = z.infer<typeof gateReviewSchema>;

interface GateReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: {
    id: string;
    stage: string;
    project: {
      name: string;
      projectId: string;
    };
  };
}

export function GateReviewForm({
  open,
  onOpenChange,
  review,
}: GateReviewFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<GateReviewFormData>({
    resolver: zodResolver(gateReviewSchema),
    defaultValues: {
      decision: undefined,
      score: undefined,
      comments: "",
    },
  });

  const onSubmit = (data: GateReviewFormData) => {
    startTransition(async () => {
      const result = await updateGateReview(review.id, data);

      if (result.success) {
        toast.success("Gate review completed successfully!");
        form.reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to complete gate review");
      }
    });
  };

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case "STAGE_0":
        return "Concept Stage - Evaluate the initial project concept and business case";
      case "STAGE_1":
        return "Research Planning - Review research methodology and resource allocation";
      case "STAGE_2":
        return "Feasibility Stage - Assess technical feasibility and market potential";
      case "STAGE_3":
        return "Maturation Stage - Evaluate readiness for commercialization";
      default:
        return "Gate review evaluation";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gate Review - {review.stage}</DialogTitle>
          <DialogDescription>
            Complete the gate review for {review.project.name} (
            {review.project.projectId})
            <br />
            {getStageDescription(review.stage)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gate Decision *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your decision" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GO">
                        <div className="flex flex-col">
                          <span className="font-medium text-green-600">GO</span>
                          <span className="text-xs text-gray-500">
                            Project meets criteria, proceed to next stage
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="RECYCLE">
                        <div className="flex flex-col">
                          <span className="font-medium text-yellow-600">
                            RECYCLE
                          </span>
                          <span className="text-xs text-gray-500">
                            Project needs improvements, return to current stage
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="HOLD">
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-600">
                            HOLD
                          </span>
                          <span className="text-xs text-gray-500">
                            Pause project temporarily
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="STOP">
                        <div className="flex flex-col">
                          <span className="font-medium text-red-600">STOP</span>
                          <span className="text-xs text-gray-500">
                            Terminate project
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Score (0-10)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="8.5"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Rate the project's overall performance and readiness
                    (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Comments *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed feedback on the project's strengths, weaknesses, and recommendations..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide comprehensive feedback to help the project team
                    understand your decision
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
