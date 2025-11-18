"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { BudgetAllocationForm } from "./budget-allocation-form";

interface BudgetAllocation {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  project: {
    name: string;
  };
  createdAt: string;
}

interface BudgetExpense {
  id: string;
  description: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  expenseDate: string;
  budgetAllocation: {
    category: string;
    subcategory: string;
  };
}

export function ProjectLeadBudgetDashboard() {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const [allocationsRes, expensesRes, projectsRes] = await Promise.all([
        fetch("/api/budget/allocations"),
        fetch("/api/budget/expenses"),
        fetch("/api/projects"),
      ]);

      if (allocationsRes.ok) {
        const allocationsData = await allocationsRes.json();
        setAllocations(allocationsData.allocations || allocationsData);
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
        if (projectsData.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectsData[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const totalAllocated = allocations.reduce(
    (sum, allocation) => sum + allocation.allocatedAmount,
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
  const approvedAllocations = allocations.filter(
    (a) => a.status === "APPROVED"
  ).length;
  const pendingAllocations = allocations.filter(
    (a) => a.status === "PENDING"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading budget data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Project Budgets
          </h1>
          <p className="text-gray-600">
            Manage budget allocations and track expenses for your projects
          </p>
        </div>
        <Button onClick={() => setShowAllocationForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Request Budget Allocation
        </Button>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Allocated
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalAllocated.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAllocated > 0
                ? `${((totalSpent / totalAllocated) * 100).toFixed(1)}% of allocated`
                : "0% of allocated"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Budget
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R{totalRemaining.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingAllocations}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Allocations and Expenses */}
      <Tabs defaultValue="allocations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocations">Budget Allocations</TabsTrigger>
          <TabsTrigger value="expenses">Expense Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocations</CardTitle>
              <CardDescription>
                Your budget allocation requests and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allocations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No budget allocations found. Request your first allocation
                    to get started.
                  </p>
                ) : (
                  allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(allocation.status)}
                          <h3 className="font-medium">
                            {allocation.category} - {allocation.subcategory}
                          </h3>
                          <Badge className={getStatusColor(allocation.status)}>
                            {allocation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {allocation.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Project: {allocation.project.name}</span>
                          <span>
                            Allocated: R
                            {allocation.allocatedAmount.toLocaleString()}
                          </span>
                          <span>
                            Spent: R{allocation.spentAmount.toLocaleString()}
                          </span>
                          <span>
                            Remaining: R
                            {allocation.remainingAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          R{allocation.allocatedAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(allocation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Claims</CardTitle>
              <CardDescription>
                Your submitted expense claims and their approval status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No expense claims found.
                  </p>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(expense.status)}
                          <h3 className="font-medium">{expense.description}</h3>
                          <Badge className={getStatusColor(expense.status)}>
                            {expense.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            Category: {expense.budgetAllocation.category} -{" "}
                            {expense.budgetAllocation.subcategory}
                          </span>
                          <span>
                            Date:{" "}
                            {new Date(expense.expenseDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          R{expense.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Budget Allocation Form Modal */}
      {showAllocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <BudgetAllocationForm
              projectId={selectedProjectId}
              onSuccess={() => {
                setShowAllocationForm(false);
                fetchBudgetData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
