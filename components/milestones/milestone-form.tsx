"use client";

import { useState, useTransition } from "react";
import { Loader2, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createMilestone } from "@/actions/milestones";
import { toast } from "sonner";

interface MilestoneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function MilestoneForm({
  open,
  onOpenChange,
  projectId,
}: MilestoneFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      const result = await createMilestone(
        projectId,
        formData.title,
        formData.description,
        new Date(formData.dueDate)
      );

      if (result.success) {
        toast.success("Milestone created successfully!");
        setFormData({
          title: "",
          description: "",
          dueDate: "",
        });
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to create milestone");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Create Milestone
          </DialogTitle>
          <DialogDescription>
            Add a new milestone to track project progress
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Milestone Title *</Label>
            <Input
              id="title"
              placeholder="Complete Phase 1 Research"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of what needs to be accomplished"
              className="min-h-[80px]"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              required
            />
          </div>

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
              <Target className="mr-2 h-4 w-4" />
              Create Milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
