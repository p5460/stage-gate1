"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertTriangle } from "lucide-react";

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
import { createRedFlag } from "@/actions/red-flags";
import { toast } from "sonner";

const raiseRedFlagSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

type RaiseRedFlagFormData = z.infer<typeof raiseRedFlagSchema>;

interface RaiseRedFlagFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RaiseRedFlagForm({
  open,
  onOpenChange,
  projectId,
  onSuccess,
  onCancel,
}: RaiseRedFlagFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<RaiseRedFlagFormData>({
    resolver: zodResolver(raiseRedFlagSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "MEDIUM",
    },
  });

  const onSubmit = (data: RaiseRedFlagFormData) => {
    startTransition(async () => {
      const result = await createRedFlag(
        projectId,
        data.title,
        data.description,
        data.severity
      );

      if (result.success) {
        toast.success("Red flag raised successfully!");
        form.reset();
        onOpenChange?.(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to raise red flag");
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

  // If no dialog props provided, render as a card
  if (open === undefined && onOpenChange === undefined) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Raise Red Flag
          </h3>
          <p className="text-sm text-muted-foreground">
            Report a risk, issue, or concern that requires attention
          </p>
        </div>

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
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {severityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className={`font-medium ${option.color}`}>
                              {option.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {option.description}
                            </span>
                          </div>
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

            <div className="flex space-x-2">
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <AlertTriangle className="mr-2 h-4 w-4" />
                Raise Red Flag
              </Button>
              {onCancel && (
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
        </Form>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Raise Red Flag
          </DialogTitle>
          <DialogDescription>
            Report a risk, issue, or concern that requires attention
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
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {severityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className={`font-medium ${option.color}`}>
                              {option.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {option.description}
                            </span>
                          </div>
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
                  <FormDescription>
                    Provide detailed information to help stakeholders understand
                    and address the issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <AlertTriangle className="mr-2 h-4 w-4" />
                Raise Red Flag
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
