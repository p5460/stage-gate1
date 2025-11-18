import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has budget access
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        customRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasPermission =
      user.role === "ADMIN" ||
      user.role === "GATEKEEPER" ||
      user.role === "PROJECT_LEAD" ||
      user.customRole?.permissions.some((p: any) =>
        ["APPROVE_BUDGET", "MANAGE_BUDGET", "VIEW_BUDGET"].includes(
          p.permission.key
        )
      );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const type = searchParams.get("type") || "allocations"; // allocations, expenses, summary
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause based on filters
    const whereClause: any = {};

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    // If user is project lead, only show their data
    if (user.role === "PROJECT_LEAD") {
      whereClause.OR = [
        { requestedBy: session.user.id },
        { submittedBy: session.user.id },
      ];
    }

    let data: any[] = [];
    let filename = "";
    let headers: string[] = [];

    if (type === "allocations") {
      const allocations = await (db as any).budgetAllocation.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              name: true,
              projectId: true,
            },
          },
          requester: {
            select: {
              name: true,
              email: true,
            },
          },
          approver: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      headers = [
        "ID",
        "Project Name",
        "Project ID",
        "Category",
        "Subcategory",
        "Description",
        "Allocated Amount",
        "Spent Amount",
        "Remaining Amount",
        "Status",
        "Requested By",
        "Requester Email",
        "Approved By",
        "Approver Email",
        "Requested Date",
        "Approved Date",
      ];

      data = allocations.map((allocation: any) => [
        allocation.id,
        allocation.project.name,
        allocation.project.projectId,
        allocation.category,
        allocation.subcategory || "",
        allocation.description || "",
        allocation.allocatedAmount,
        allocation.spentAmount,
        allocation.remainingAmount,
        allocation.status,
        allocation.requester.name,
        allocation.requester.email,
        allocation.approver?.name || "",
        allocation.approver?.email || "",
        allocation.requestedAt?.toISOString().split("T")[0] || "",
        allocation.approvedAt?.toISOString().split("T")[0] || "",
      ]);

      filename = `budget-allocations-${new Date().toISOString().split("T")[0]}`;
    } else if (type === "expenses") {
      const expenses = await (db as any).budgetExpense.findMany({
        where: whereClause,
        include: {
          budgetAllocation: {
            include: {
              project: {
                select: {
                  name: true,
                  projectId: true,
                },
              },
            },
          },
          submitter: {
            select: {
              name: true,
              email: true,
            },
          },
          approver: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      headers = [
        "ID",
        "Project Name",
        "Project ID",
        "Allocation Category",
        "Allocation Subcategory",
        "Description",
        "Amount",
        "Expense Date",
        "Status",
        "Receipt URL",
        "Submitted By",
        "Submitter Email",
        "Approved By",
        "Approver Email",
        "Submitted Date",
        "Approved Date",
      ];

      data = expenses.map((expense: any) => [
        expense.id,
        expense.budgetAllocation.project.name,
        expense.budgetAllocation.project.projectId,
        expense.budgetAllocation.category,
        expense.budgetAllocation.subcategory || "",
        expense.description,
        expense.amount,
        expense.expenseDate?.toISOString().split("T")[0] || "",
        expense.status,
        expense.receiptUrl || "",
        expense.submitter.name,
        expense.submitter.email,
        expense.approver?.name || "",
        expense.approver?.email || "",
        expense.createdAt?.toISOString().split("T")[0] || "",
        expense.approvedAt?.toISOString().split("T")[0] || "",
      ]);

      filename = `budget-expenses-${new Date().toISOString().split("T")[0]}`;
    } else if (type === "summary") {
      // Get summary data
      const [allocations, expenses, projects] = await Promise.all([
        (db as any).budgetAllocation.groupBy({
          by: ["projectId", "status"],
          _sum: {
            allocatedAmount: true,
            spentAmount: true,
            remainingAmount: true,
          },
          _count: true,
        }),
        (db as any).budgetExpense.groupBy({
          by: ["budgetAllocationId"],
          _sum: { amount: true },
          _count: true,
        }),
        db.project.findMany({
          select: {
            id: true,
            name: true,
            projectId: true,
            budget: true,
            budgetUtilization: true,
          },
        }),
      ]);

      headers = [
        "Project Name",
        "Project ID",
        "Total Budget",
        "Budget Utilization %",
        "Total Allocated",
        "Total Spent",
        "Total Remaining",
        "Pending Allocations",
        "Approved Allocations",
        "Rejected Allocations",
        "Total Expenses",
        "Expense Count",
      ];

      const projectMap = new Map(projects.map((p: any) => [p.id, p]));
      const allocationsByProject = new Map();
      const expensesByProject = new Map();

      // Group allocations by project
      allocations.forEach((allocation: any) => {
        const projectId = allocation.projectId;
        if (!allocationsByProject.has(projectId)) {
          allocationsByProject.set(projectId, {
            total: 0,
            spent: 0,
            remaining: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
          });
        }
        const summary = allocationsByProject.get(projectId);
        summary.total += allocation._sum.allocatedAmount || 0;
        summary.spent += allocation._sum.spentAmount || 0;
        summary.remaining += allocation._sum.remainingAmount || 0;

        if (allocation.status === "PENDING")
          summary.pending += allocation._count;
        else if (allocation.status === "APPROVED")
          summary.approved += allocation._count;
        else if (allocation.status === "REJECTED")
          summary.rejected += allocation._count;
      });

      data = projects.map((project: any) => {
        const allocSummary = allocationsByProject.get(project.id) || {
          total: 0,
          spent: 0,
          remaining: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        };

        return [
          project.name,
          project.projectId,
          project.budget || 0,
          project.budgetUtilization || 0,
          allocSummary.total,
          allocSummary.spent,
          allocSummary.remaining,
          allocSummary.pending,
          allocSummary.approved,
          allocSummary.rejected,
          0, // Total expenses - would need to calculate
          0, // Expense count - would need to calculate
        ];
      });

      filename = `budget-summary-${new Date().toISOString().split("T")[0]}`;
    }

    if (format === "csv") {
      const csvContent = [
        headers.join(","),
        ...data.map((row) => row.join(",")),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === "json") {
      const jsonData = data.map((row) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      return NextResponse.json({
        data: jsonData,
        metadata: {
          total: data.length,
          exported: new Date().toISOString(),
          type,
          filters: { projectId, status, startDate, endDate },
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("Budget export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
