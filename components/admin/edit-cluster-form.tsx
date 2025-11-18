"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Edit, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { updateCluster } from "@/actions/clusters";
import { toast } from "sonner";

const editClusterSchema = z.object({
  name: z.string().min(1, "Cluster name is required"),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
});

type EditClusterFormData = z.infer<typeof editClusterSchema>;

interface Cluster {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  _count?: {
    projects: number;
  };
}

interface EditClusterFormProps {
  cluster: Cluster;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const predefinedColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#14B8A6", // Teal
  "#F472B6", // Rose
];

export function EditClusterForm({
  cluster,
  onSuccess,
  trigger,
}: EditClusterFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditClusterFormData>({
    resolver: zodResolver(editClusterSchema),
    defaultValues: {
      name: cluster.name,
      description: cluster.description || "",
      color: cluster.color || "#3B82F6",
    },
  });

  const onSubmit = (data: EditClusterFormData) => {
    startTransition(async () => {
      const result = await updateCluster(cluster.id, data);

      if (result.success) {
        toast.success("Cluster updated successfully!");
        form.reset(data);
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to update cluster");
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form to original values when closing
      form.reset({
        name: cluster.name,
        description: cluster.description || "",
        color: cluster.color || "#3B82F6",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit Cluster</span>
          </DialogTitle>
          <DialogDescription>
            Update the cluster information and settings.
          </DialogDescription>
        </DialogHeader>

        {/* Current cluster info */}
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: cluster.color || "#3B82F6" }}
            />
            <div>
              <h4 className="font-medium">{cluster.name}</h4>
              {cluster._count && (
                <p className="text-sm text-gray-500">
                  {cluster._count.projects} project
                  {cluster._count.projects !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          {cluster.description && (
            <p className="text-sm text-gray-600 mt-2">{cluster.description}</p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cluster Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Smart Places" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Smart city and urban technology solutions"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of the cluster's focus area
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span>Color</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Input
                          type="color"
                          {...field}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: field.value }}
                          />
                          <span className="text-sm font-mono">
                            {field.value}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 hover:border-gray-500 transition-colors ${
                              field.value === color
                                ? "border-gray-800 ring-2 ring-gray-300"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a color to represent this cluster
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Preview</h4>
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: form.watch("color") }}
                />
                <div>
                  <span className="font-medium">
                    {form.watch("name") || "Cluster Name"}
                  </span>
                  {form.watch("description") && (
                    <p className="text-sm text-gray-600">
                      {form.watch("description")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Cluster
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
