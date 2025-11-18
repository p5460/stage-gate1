"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DollarSign, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BudgetAllocationProps {
  projectId?: string;
  clusterId?: string;
  onAllocationComplete?: () => void;
}

export function BudgetAllocation({
  projectId,
  clusterId,
  onAllocationComplete,
}: BudgetAllocationProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [allocationType, setAllocationType] = useState<
    "project" | "cluster" | "global"
  >("project");

  const handleAllocation = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/budget/allocate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type: allocationType,
          projectId: allocationType === "project" ? projectId : undefined,
          clusterId: allocationType === "cluster" ? clusterId : undefined,
          description: description || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Budget allocated successfully");
        setAmount("");
        setDescription("");
        onAllocationComplete?.();
      } else {
        toast.error(data.error || "Failed to allocate budget");
      }
    } catch (error) {
      console.error("Budget allocation error:", error);
      toast.error("Error allocating budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span>Budget Allocation</span>
        </CardTitle>
        <CardDescription>
          Allocate budget to projects, clusters, or globally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="allocation-type">Allocation Type</Label>
          <Select
            value={allocationType}
            onValueChange={(value: any) => setAllocationType(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="cluster">Cluster</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (ZAR)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Enter description for this allocation"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleAllocation}
          disabled={loading || !amount}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Allocating...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Allocate Budget
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Quick Budget Allocation Dialog Component
export function BudgetAllocationDialog({
  trigger,
  projectId,
  clusterId,
  onAllocationComplete,
}: {
  trigger: React.ReactNode;
  projectId?: string;
  clusterId?: string;
  onAllocationComplete?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleComplete = () => {
    setOpen(false);
    onAllocationComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Allocate Budget</DialogTitle>
          <DialogDescription>
            Allocate budget for this{" "}
            {projectId ? "project" : clusterId ? "cluster" : "allocation"}.
          </DialogDescription>
        </DialogHeader>
        <BudgetAllocation
          projectId={projectId}
          clusterId={clusterId}
          onAllocationComplete={handleComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
