"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, DollarSign } from "lucide-react";

const budgetAllocationSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  allocatedAmount: z.number().min(0.01, "Amount must be greater than 0"),
});

type BudgetAllocationFormData = z.infer<typeof budgetAllocationSchema>;

interface BudgetAllocationFormProps {
  projectId: string;
  onSuccess?: () => void;
}

const BUDGET_CATEGORIES = [
  "Personnel",
  "Equipment",
  "Materials",
  "Travel",
  "Overhead",
  "Subcontracts",
  "Other Direct Costs",
];

const SUBCATEGORIES = {
  Personnel: ["Salaries", "Benefits", "Consultants", "Students"],
  Equipment: [
    "Laboratory Equipment",
    "Computing Equipment",
    "Software",
    "Maintenance",
  ],
  Materials: ["Consumables", "Supplies", "Chemicals", "Components"],
  Travel: [
    "Domestic Travel",
    "International Travel",
    "Accommodation",
    "Per Diem",
  ],
  Overhead: ["Administrative Costs", "Facilities", "Utilities"],
  Subcontracts: ["External Partners", "Service Providers", "Collaborators"],
  "Other Direct Costs": [
    "Publication Fees",
    "Patent Costs",
    "Training",
    "Miscellaneous",
  ],
};

export function BudgetAllocationForm({
  projectId,
  onSuccess,
}: BudgetAllocationFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BudgetAllocationFormData>({
    resolver: zodResolver(budgetAllocationSchema),
    defaultValues: {
      category: "",
      subcategory: "",
      description: "",
      allocatedAmount: 0,
    },
  });

  const selectedCategory = form.watch("category");

  const onSubmit = async (data: BudgetAllocationFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/budget/allocations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create budget allocation");
      }

      toast.success("Budget allocation request submitted successfully");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating budget allocation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create budget allocation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Request Budget Allocation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Budget Allocation</DialogTitle>
          <DialogDescription>
            Submit a request for budget allocation for this project. The request
            will need approval from authorized personnel.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a budget category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCategory &&
              SUBCATEGORIES[selectedCategory as keyof typeof SUBCATEGORIES] && (
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subcategory (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUBCATEGORIES[
                            selectedCategory as keyof typeof SUBCATEGORIES
                          ].map((subcategory) => (
                            <SelectItem key={subcategory} value={subcategory}>
                              {subcategory}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            <FormField
              control={form.control}
              name="allocatedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Amount (ZAR)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the amount you are requesting for this budget
                    category.
                  </FormDescription>
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
                      placeholder="Provide details about what this budget allocation will be used for..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Provide additional context for this budget
                    request.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
