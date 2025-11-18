"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Eye,
} from "lucide-react";

interface BudgetAllocation {
  id: string;
  category: string;
  subcategory?: string;
  description?: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PARTIALLY_APPROVED";
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  expenses: Array<{
    id: string;
    description: string;
    amount: number;
    expenseDate: string;
    status: string;
    submitter: {
      name: string;
    };
  }>;
}

interface BudgetAllocationListProps {
  projectId: string;
  canApprove?: boolean;
}

export function BudgetAllocationList({
  projectId,
  canApprove = false,
}: BudgetAllocationListProps) {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAllocation, setSelectedAllocation] =
    useState<BudgetAllocation | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  );
  const [approvalComments, setApprovalComments] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAllocations();
  }, [projectId]);

  const fetchAllocations = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/budget`);
      if (response.ok) {
        const data = await response.json();
        setAllocations(data.budgetAllocations || []);
      }
    } catch (error) {
      console.error("Error fetching budget allocations:", error);
      toast.error("Failed to load budget allocations");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedAllocation) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/budget/allocations/${selectedAllocation.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: approvalStatus,
            comments: approvalComments,
            approvedAmount:
              approvalStatus === "APPROVED" ? approvedAmount : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process approval");
      }

      toast.success(
        `Budget allocation ${approvalStatus.toLowerCase()} successfully`
      );
      setApprovalDialog(false);
      setSelectedAllocation(null);
      setApprovalComments("");
      fetchAllocations();
    } catch (error) {
      console.error("Error processing approval:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process approval"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "PARTIALLY_APPROVED":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Partially Approved
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getUtilizationPercentage = (spent: number, allocated: number) => {
    return allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        Loading budget allocations...
      </div>
    );
  }

  const totalAllocated = allocations.reduce(
    (sum, allocation) =>
      allocation.status === "APPROVED" ? sum + allocation.allocatedAmount : sum,
    0
  );
  const totalSpent = allocations.reduce(
    (sum, allocation) => sum + allocation.spentAmount,
    0
  );
  const totalRemaining = allocations.reduce(
    (sum, allocation) => sum + allocation.remainingAmount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Allocated
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAllocated)}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved budget allocations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAllocated > 0
                ? `${Math.round((totalSpent / totalAllocated) * 100)}%`
                : "0%"}{" "}
              of allocated budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Allocations</CardTitle>
          <CardDescription>
            Track budget allocations, approvals, and spending for this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No budget allocations found for this project.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{allocation.category}</div>
                        {allocation.subcategory && (
                          <div className="text-sm text-muted-foreground">
                            {allocation.subcategory}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(allocation.allocatedAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{formatCurrency(allocation.spentAmount)}</div>
                        {allocation.status === "APPROVED" && (
                          <Progress
                            value={getUtilizationPercentage(
                              allocation.spentAmount,
                              allocation.allocatedAmount
                            )}
                            className="h-2"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(allocation.remainingAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(allocation.status)}</TableCell>
                    <TableCell>{allocation.requester.name}</TableCell>
                    <TableCell>
                      {format(new Date(allocation.requestedAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Budget Allocation Details
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">
                                    Category
                                  </Label>
                                  <p className="text-sm">
                                    {allocation.category}
                                  </p>
                                </div>
                                {allocation.subcategory && (
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Subcategory
                                    </Label>
                                    <p className="text-sm">
                                      {allocation.subcategory}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <Label className="text-sm font-medium">
                                    Requested Amount
                                  </Label>
                                  <p className="text-sm">
                                    {formatCurrency(allocation.allocatedAmount)}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">
                                    Status
                                  </Label>
                                  <div className="mt-1">
                                    {getStatusBadge(allocation.status)}
                                  </div>
                                </div>
                              </div>
                              {allocation.description && (
                                <div>
                                  <Label className="text-sm font-medium">
                                    Description
                                  </Label>
                                  <p className="text-sm mt-1">
                                    {allocation.description}
                                  </p>
                                </div>
                              )}
                              {allocation.expenses.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium">
                                    Expenses
                                  </Label>
                                  <div className="mt-2 space-y-2">
                                    {allocation.expenses.map((expense) => (
                                      <div
                                        key={expense.id}
                                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                      >
                                        <div>
                                          <p className="text-sm font-medium">
                                            {expense.description}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            by {expense.submitter.name} on{" "}
                                            {format(
                                              new Date(expense.expenseDate),
                                              "MMM dd, yyyy"
                                            )}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-medium">
                                            {formatCurrency(expense.amount)}
                                          </p>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {expense.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        {canApprove && allocation.status === "PENDING" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAllocation(allocation);
                              setApprovedAmount(allocation.allocatedAmount);
                              setApprovalDialog(true);
                            }}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Budget Allocation</DialogTitle>
            <DialogDescription>
              Review and approve or reject this budget allocation request.
            </DialogDescription>
          </DialogHeader>
          {selectedAllocation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{selectedAllocation.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Requested Amount
                  </Label>
                  <p className="text-sm">
                    {formatCurrency(selectedAllocation.allocatedAmount)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Decision</Label>
                <div className="flex space-x-4">
                  <Button
                    variant={
                      approvalStatus === "APPROVED" ? "default" : "outline"
                    }
                    onClick={() => setApprovalStatus("APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant={
                      approvalStatus === "REJECTED" ? "destructive" : "outline"
                    }
                    onClick={() => setApprovalStatus("REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
              </div>

              {approvalStatus === "APPROVED" && (
                <div>
                  <Label htmlFor="approvedAmount">Approved Amount (ZAR)</Label>
                  <Input
                    id="approvedAmount"
                    type="number"
                    step="0.01"
                    value={approvedAmount}
                    onChange={(e) =>
                      setApprovedAmount(parseFloat(e.target.value) || 0)
                    }
                    max={selectedAllocation.allocatedAmount}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Add comments about your decision..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setApprovalDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleApproval} disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Submit Decision"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
