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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertTriangle,
  FileText,
  Users,
} from "lucide-react";

interface PendingAllocation {
  id: string;
  category: string;
  subcategory?: string;
  description?: string;
  allocatedAmount: number;
  requestedAt: string;
  project: {
    id: string;
    name: string;
    projectId: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
}

interface PendingExpense {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string;
  budgetAllocation: {
    id: string;
    category: string;
    project: {
      id: string;
      name: string;
      projectId: string;
    };
  };
  submitter: {
    id: string;
    name: string;
    email: string;
  };
}

export function BudgetManagementClient() {
  const [pendingAllocations, setPendingAllocations] = useState<
    PendingAllocation[]
  >([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalType, setApprovalType] = useState<"allocation" | "expense">(
    "allocation"
  );
  const [approvalStatus, setApprovalStatus] = useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  );
  const [approvalComments, setApprovalComments] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch("/api/budget/allocations");
      if (response.ok) {
        const data = await response.json();
        setPendingAllocations(data.pendingAllocations || []);
        setPendingExpenses(data.pendingExpenses || []);
      }
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const endpoint =
        approvalType === "allocation"
          ? `/api/budget/allocations/${selectedItem.id}/approve`
          : `/api/budget/expenses/${selectedItem.id}/approve`;

      const body =
        approvalType === "allocation"
          ? {
              status: approvalStatus,
              comments: approvalComments,
              approvedAmount:
                approvalStatus === "APPROVED" ? approvedAmount : undefined,
            }
          : {
              status: approvalStatus,
              comments: approvalComments,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process approval");
      }

      toast.success(
        `${approvalType === "allocation" ? "Budget allocation" : "Expense"} ${approvalStatus.toLowerCase()} successfully`
      );
      setApprovalDialog(false);
      setSelectedItem(null);
      setApprovalComments("");
      fetchPendingApprovals();
    } catch (error) {
      console.error("Error processing approval:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process approval"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const openApprovalDialog = (item: any, type: "allocation" | "expense") => {
    setSelectedItem(item);
    setApprovalType(type);
    setApprovalStatus("APPROVED");
    setApprovalComments("");
    if (type === "allocation") {
      setApprovedAmount(item.allocatedAmount);
    }
    setApprovalDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        Loading budget management...
      </div>
    );
  }

  const totalPendingAmount = pendingAllocations.reduce(
    (sum, allocation) => sum + allocation.allocatedAmount,
    0
  );
  const totalPendingExpenses = pendingExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Allocations
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingAllocations.length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total allocation requests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Expenses
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expense Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPendingExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total expense claims
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different approval types */}
      <Tabs defaultValue="allocations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocations">
            Budget Allocations ({pendingAllocations.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Expense Claims ({pendingExpenses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Budget Allocations</CardTitle>
              <CardDescription>
                Review and approve budget allocation requests from project
                teams.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAllocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending budget allocation requests.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAllocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {allocation.project.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {allocation.project.projectId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {allocation.category}
                            </div>
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
                        <TableCell>{allocation.requester.name}</TableCell>
                        <TableCell>
                          {format(
                            new Date(allocation.requestedAt),
                            "MMM dd, yyyy"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openApprovalDialog(allocation, "allocation")
                            }
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Expense Claims</CardTitle>
              <CardDescription>
                Review and approve expense claims submitted by project teams.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending expense claims.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {expense.budgetAllocation.project.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {expense.budgetAllocation.project.projectId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>
                          {expense.budgetAllocation.category}
                        </TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{expense.submitter.name}</TableCell>
                        <TableCell>
                          {format(
                            new Date(expense.expenseDate),
                            "MMM dd, yyyy"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openApprovalDialog(expense, "expense")
                            }
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Review{" "}
              {approvalType === "allocation"
                ? "Budget Allocation"
                : "Expense Claim"}
            </DialogTitle>
            <DialogDescription>
              Review and approve or reject this{" "}
              {approvalType === "allocation"
                ? "budget allocation request"
                : "expense claim"}
              .
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Project</Label>
                  <p className="text-sm">
                    {approvalType === "allocation"
                      ? selectedItem.project.name
                      : selectedItem.budgetAllocation.project.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {approvalType === "allocation" ? "Category" : "Description"}
                  </Label>
                  <p className="text-sm">
                    {approvalType === "allocation"
                      ? selectedItem.category
                      : selectedItem.description}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm">
                    {formatCurrency(
                      approvalType === "allocation"
                        ? selectedItem.allocatedAmount
                        : selectedItem.amount
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {approvalType === "allocation"
                      ? "Requested By"
                      : "Submitted By"}
                  </Label>
                  <p className="text-sm">
                    {approvalType === "allocation"
                      ? selectedItem.requester.name
                      : selectedItem.submitter.name}
                  </p>
                </div>
              </div>

              {approvalType === "allocation" && selectedItem.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1">{selectedItem.description}</p>
                </div>
              )}

              {approvalType === "expense" && selectedItem.receiptUrl && (
                <div>
                  <Label className="text-sm font-medium">Receipt</Label>
                  <a
                    href={selectedItem.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Receipt
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <Label>Decision</Label>
                <div className="flex space-x-4">
                  <Button
                    variant={
                      approvalStatus === "APPROVED" ? "default" : "outline"
                    }
                    onClick={() => setApprovalStatus("APPROVED")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant={
                      approvalStatus === "REJECTED" ? "destructive" : "outline"
                    }
                    onClick={() => setApprovalStatus("REJECTED")}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              {approvalType === "allocation" &&
                approvalStatus === "APPROVED" && (
                  <div>
                    <Label htmlFor="approvedAmount">
                      Approved Amount (ZAR)
                    </Label>
                    <Input
                      id="approvedAmount"
                      type="number"
                      step="0.01"
                      value={approvedAmount}
                      onChange={(e) =>
                        setApprovedAmount(parseFloat(e.target.value) || 0)
                      }
                      max={selectedItem.allocatedAmount}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can approve a different amount than requested (max:{" "}
                      {formatCurrency(selectedItem.allocatedAmount)})
                    </p>
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
