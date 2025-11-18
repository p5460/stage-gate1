"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertTriangle, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { updateRedFlag } from "@/actions/red-flags";
import { toast } from "sonner";

const editRedFlagSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

type EditRedFlagFormData = z.infer<typeof editRedFlagSchema>;

interface EditRedFlagFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redFlag: {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
  };
  onSuccess?: () => void;
}

export function EditRedFlagForm({
  open,
  onOpenChange,
  redFlag,
  onSuccess,
}: EditRedFlagFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditRedFlagFormData>({
    resolver: zodResolver(editRedFlagSchema),
    defaultValues: {
      title: redFlag.title,
      description: redFlag.description,
      severity: redFlag.severity as any,
      status: redFlag.status as any,
    },
  });

  const onSubmit = (data: EditRedFlagFormData) => {
    startTransition(async () => {
      const result = await updateRedFlag(redFlag.id, {
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status,
      });

      if (result.success) {
        toast.success("Red flag updated successfully!");
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update red flag");
      }
    });
  };

  const severityOptions = [
    {
      value: "LOW",
      label: "Low",
      description: "Minor issue that can be addressed later",
      color: "text-blue-600",
    },
    {
      value: "MEDIUM",
      label: "Medium",
      description: "Issue that needs attention but not urgent",
      color: "text-yellow-600",
    },
    {
      value: "HIGH",
      label: "High",
      description: "Significant issue requiring immediate attention",
      color: "text-orange-600",
    },
    {
      value: "CRITICAL",
      label: "Critical",
      description: "Severe issue that may halt project progress",
      color: "text-red-600",
    },
  ];

  const statusOptions = [
    { value: "OPEN", label: "Open", color: "text-red-600" },
    { value: "IN_PROGRESS", label: "In Progress", color: "text-yellow-600" },
    { value: "RESOLVED", label: "Resolved", color: "text-green-600" },
    { value: "CLOSED", label: "Closed", color: "text-gray-600" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2 text-blue-500" />
            Edit Red Flag
          </DialogTitle>
          <DialogDescription>
            Update the red flag details and status
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Budget overrun risk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity Level *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {severityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={`font-medium ${option.color}`}>
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={`font-medium ${option.color}`}>
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue, its potential impact, and any relevant details..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
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
                <Edit className="mr-2 h-4 w-4" />
                Update Red Flag
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
