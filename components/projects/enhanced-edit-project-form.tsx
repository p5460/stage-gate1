"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Calendar, DollarSign, Users, Settings } from "lucide-react";
import { toast } from "sonner";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"]),
  currentStage: z.enum(["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3"]),
  budget: z.number().min(0).optional(),
  budgetUtilization: z.number().min(0).max(100).optional(),
  duration: z.number().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  technologyReadiness: z.string().optional(),
  ipPotential: z.string().optional(),
  clusterId: z.string().min(1, "Cluster is required"),
  leadId: z.string().min(1, "Project lead is required"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EnhancedEditProjectFormProps {
  project: any;
  clusters: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string; email: string }>;
  onSuccess?: () => void;
}

export function EnhancedEditProjectForm({
  project,
  clusters,
  users,
  onSuccess,
}: EnhancedEditProjectFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      status: project.status,
      currentStage: project.currentStage,
      budget: project.budget || 0,
      budgetUtilization: project.budgetUtilization || 0,
      duration: project.duration || 12,
      startDate: project.startDate
        ? typeof project.startDate === "string"
          ? project.startDate.split("T")[0]
          : new Date(project.startDate).toISOString().split("T")[0]
        : "",
      endDate: project.endDate
        ? typeof project.endDate === "string"
          ? project.endDate.split("T")[0]
          : new Date(project.endDate).toISOString().split("T")[0]
        : "",
      technologyReadiness: project.technologyReadiness || "",
      ipPotential: project.ipPotential || "",
      clusterId: project.clusterId,
      leadId: project.leadId,
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate
            ? new Date(data.startDate).toISOString()
            : null,
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      toast.success("Project updated successfully");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update project";
      toast.error(errorMessage);
      console.error("Error updating project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Project: {project.name}
          </DialogTitle>
          <DialogDescription>
            Update project information across different categories.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter project name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Project description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) => setValue("status", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentStage">Current Stage</Label>
                  <Select
                    value={watch("currentStage")}
                    onValueChange={(value) =>
                      setValue("currentStage", value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAGE_0">Stage 0: Concept</SelectItem>
                      <SelectItem value="STAGE_1">
                        Stage 1: Research Planning
                      </SelectItem>
                      <SelectItem value="STAGE_2">
                        Stage 2: Feasibility
                      </SelectItem>
                      <SelectItem value="STAGE_3">
                        Stage 3: Maturation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clusterId">Cluster</Label>
                  <Select
                    value={watch("clusterId")}
                    onValueChange={(value) => setValue("clusterId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters.map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          {cluster.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadId">Project Lead</Label>
                  <Select
                    value={watch("leadId")}
                    onValueChange={(value) => setValue("leadId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (R)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="1000"
                    {...register("budget", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetUtilization">
                    Budget Utilization (%)
                  </Label>
                  <Input
                    id="budgetUtilization"
                    type="number"
                    min="0"
                    max="100"
                    {...register("budgetUtilization", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (months)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  {...register("duration", { valueAsNumber: true })}
                  placeholder="12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" {...register("endDate")} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="technologyReadiness">
                  Technology Readiness Level
                </Label>
                <Select
                  value={watch("technologyReadiness")}
                  onValueChange={(value) =>
                    setValue("technologyReadiness", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select TRL" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRL_1">
                      TRL 1 - Basic principles
                    </SelectItem>
                    <SelectItem value="TRL_2">
                      TRL 2 - Technology concept
                    </SelectItem>
                    <SelectItem value="TRL_3">
                      TRL 3 - Experimental proof
                    </SelectItem>
                    <SelectItem value="TRL_4">
                      TRL 4 - Lab validation
                    </SelectItem>
                    <SelectItem value="TRL_5">
                      TRL 5 - Relevant environment
                    </SelectItem>
                    <SelectItem value="TRL_6">TRL 6 - Demonstration</SelectItem>
                    <SelectItem value="TRL_7">
                      TRL 7 - System prototype
                    </SelectItem>
                    <SelectItem value="TRL_8">
                      TRL 8 - System complete
                    </SelectItem>
                    <SelectItem value="TRL_9">TRL 9 - Actual system</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipPotential">IP Potential</Label>
                <Select
                  value={watch("ipPotential")}
                  onValueChange={(value) => setValue("ipPotential", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select IP potential" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NONE">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
