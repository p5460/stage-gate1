"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Budget allocation schema
const BudgetAllocationSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  allocatedAmount: z.number().min(0.01, "Amount must be greater than 0"),
});

const BudgetApprovalSchema = z.object({
  budgetAllocationId: z.string().min(1, "Budget allocation ID is required"),
  status: z.enum(["APPROVED", "REJECTED"]),
  comments: z.string().optional(),
  approvedAmount: z.number().optional(),
});

const ExpenseSchema = z.object({
  budgetAllocationId: z.string().min(1, "Budget allocation ID is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  expenseDate: z.date(),
  receiptUrl: z.string().optional(),
});

// Create budget allocation
export async function createBudgetAllocation(
  data: z.infer<typeof BudgetAllocationSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validatedData = BudgetAllocationSchema.parse(data);

    // Check if user has permission to create budget allocations
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        customRole: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if user is project lead or has budget management permission
    const project = await db.project.findUnique({
      where: { id: validatedData.projectId },
      include: { lead: true, members: true },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    const isProjectLead = project.leadId === session.user.id;
    const isProjectMember = project.members.some(
      (member: any) => member.userId === session.user.id
    );
    const hasManageBudgetPermission =
      user.role === "ADMIN" ||
      user.role === "GATEKEEPER" ||
      user.customRole?.permissions.some(
        (p: any) => p.permission.key === "MANAGE_BUDGET"
      );

    if (!isProjectLead && !isProjectMember && !hasManageBudgetPermission) {
      return { error: "Insufficient permissions to create budget allocation" };
    }

    // Create budget allocation
    const budgetAllocation = await (db as any).budgetAllocation.create({
      data: {
        ...validatedData,
        remainingAmount: validatedData.allocatedAmount,
        requestedBy: session.user.id,
      },
      include: {
        project: true,
        requester: true,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: validatedData.projectId,
        action: "BUDGET_ALLOCATION_CREATED",
        details: `Budget allocation created for ${validatedData.category}: ${new Intl.NumberFormat(
          "en-ZA",
          {
            style: "currency",
            currency: "ZAR",
          }
        ).format(validatedData.allocatedAmount)}`,
        metadata: { budgetAllocationId: budgetAllocation.id },
      },
    });

    // Send notification to project lead and admins
    const admins = await db.user.findMany({
      where: {
        OR: [
          { role: "ADMIN" },
          { role: "GATEKEEPER" },
          {
            customRole: {
              permissions: { some: { permission: { key: "APPROVE_BUDGET" } } },
            },
          },
        ],
      },
    });

    const notificationRecipients = [project.lead, ...admins].filter(
      (user, index, self) =>
        user && self.findIndex((u) => u.id === user.id) === index
    );

    for (const recipient of notificationRecipients) {
      if (recipient.id !== session.user.id) {
        await db.notification.create({
          data: {
            userId: recipient.id,
            type: "APPROVAL",
            title: "New Budget Allocation Request",
            message: `${user.name} has requested budget allocation for ${project.name}: ${validatedData.category}`,
            data: {
              projectId: project.id,
              budgetAllocationId: budgetAllocation.id,
              amount: validatedData.allocatedAmount,
            },
          },
        });
      }
    }

    revalidatePath(`/projects/${project.id}`);
    revalidatePath("/admin/budget");

    return { success: true, budgetAllocation };
  } catch (error) {
    console.error("Error creating budget allocation:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to create budget allocation" };
  }
}

// Approve or reject budget allocation
export async function approveBudgetAllocation(
  data: z.infer<typeof BudgetApprovalSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validatedData = BudgetApprovalSchema.parse(data);

    // Check if user has permission to approve budgets
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        customRole: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const hasApprovalPermission =
      user.role === "ADMIN" ||
      user.role === "GATEKEEPER" ||
      user.customRole?.permissions.some(
        (p: any) => p.permission.key === "APPROVE_BUDGET"
      );

    if (!hasApprovalPermission) {
      return { error: "Insufficient permissions to approve budget allocation" };
    }

    // Get budget allocation
    const budgetAllocation = await (db as any).budgetAllocation.findUnique({
      where: { id: validatedData.budgetAllocationId },
      include: { project: true, requester: true },
    });

    if (!budgetAllocation) {
      return { error: "Budget allocation not found" };
    }

    if (budgetAllocation.status !== "PENDING") {
      return { error: "Budget allocation has already been processed" };
    }

    // Update budget allocation
    const updatedAllocation = await (db as any).budgetAllocation.update({
      where: { id: validatedData.budgetAllocationId },
      data: {
        status: validatedData.status,
        ...(validatedData.status === "APPROVED"
          ? {
              approvedBy: session.user.id,
              approvedAt: new Date(),
              remainingAmount:
                validatedData.approvedAmount ||
                budgetAllocation.allocatedAmount,
              allocatedAmount:
                validatedData.approvedAmount ||
                budgetAllocation.allocatedAmount,
            }
          : {
              rejectedBy: session.user.id,
              rejectedAt: new Date(),
              rejectionReason: validatedData.comments,
            }),
      },
    });

    // Create budget approval record
    await (db as any).budgetApproval.create({
      data: {
        budgetAllocationId: validatedData.budgetAllocationId,
        approverId: session.user.id,
        status: validatedData.status,
        comments: validatedData.comments,
        approvedAmount: validatedData.approvedAmount,
        approvedAt:
          validatedData.status === "APPROVED" ? new Date() : undefined,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: budgetAllocation.projectId,
        action: `BUDGET_ALLOCATION_${validatedData.status}`,
        details: `Budget allocation ${validatedData.status.toLowerCase()} for ${budgetAllocation.category}`,
        metadata: { budgetAllocationId: budgetAllocation.id },
      },
    });

    // Send notification to requester
    await db.notification.create({
      data: {
        userId: budgetAllocation.requestedBy,
        type: validatedData.status === "APPROVED" ? "APPROVAL" : "REJECTION",
        title: `Budget Allocation ${validatedData.status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `Your budget allocation request for ${budgetAllocation.category} has been ${validatedData.status.toLowerCase()}`,
        data: {
          projectId: budgetAllocation.projectId,
          budgetAllocationId: budgetAllocation.id,
          amount:
            validatedData.approvedAmount || budgetAllocation.allocatedAmount,
        },
      },
    });

    revalidatePath(`/projects/${budgetAllocation.projectId}`);
    revalidatePath("/admin/budget");

    return { success: true, budgetAllocation: updatedAllocation };
  } catch (error) {
    console.error("Error approving budget allocation:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to process budget allocation" };
  }
}

// Get budget allocations for a project
export async function getProjectBudgetAllocations(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const budgetAllocations = await (db as any).budgetAllocation.findMany({
      where: { projectId },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        rejecter: { select: { id: true, name: true, email: true } },
        expenses: {
          include: {
            submitter: { select: { id: true, name: true, email: true } },
            approver: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, budgetAllocations };
  } catch (error) {
    console.error("Error fetching budget allocations:", error);
    return { error: "Failed to fetch budget allocations" };
  }
}

// Submit expense
export async function submitExpense(data: z.infer<typeof ExpenseSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const validatedData = ExpenseSchema.parse(data);

    // Check if budget allocation exists and user has access
    const budgetAllocation = await (db as any).budgetAllocation.findUnique({
      where: { id: validatedData.budgetAllocationId },
      include: { project: { include: { members: true } } },
    });

    if (!budgetAllocation) {
      return { error: "Budget allocation not found" };
    }

    if (budgetAllocation.status !== "APPROVED") {
      return {
        error: "Budget allocation must be approved before submitting expenses",
      };
    }

    // Check if user has access to submit expenses
    const isProjectLead = budgetAllocation.project.leadId === session.user.id;
    const isProjectMember = budgetAllocation.project.members.some(
      (member: any) => member.userId === session.user.id
    );
    const isRequester = budgetAllocation.requestedBy === session.user.id;

    if (!isProjectLead && !isProjectMember && !isRequester) {
      return { error: "Insufficient permissions to submit expense" };
    }

    // Check if expense amount doesn't exceed remaining budget
    if (validatedData.amount > budgetAllocation.remainingAmount) {
      return { error: "Expense amount exceeds remaining budget allocation" };
    }

    // Create expense
    const expense = await (db as any).budgetExpense.create({
      data: {
        ...validatedData,
        submittedBy: session.user.id,
      },
      include: {
        budgetAllocation: { include: { project: true } },
        submitter: true,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: budgetAllocation.projectId,
        action: "EXPENSE_SUBMITTED",
        details: `Expense submitted: ${validatedData.description} - ${new Intl.NumberFormat(
          "en-ZA",
          {
            style: "currency",
            currency: "ZAR",
          }
        ).format(validatedData.amount)}`,
        metadata: {
          expenseId: expense.id,
          budgetAllocationId: budgetAllocation.id,
        },
      },
    });

    revalidatePath(`/projects/${budgetAllocation.projectId}`);

    return { success: true, expense };
  } catch (error) {
    console.error("Error submitting expense:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to submit expense" };
  }
}

// Approve expense
export async function approveExpense(
  expenseId: string,
  status: "APPROVED" | "REJECTED",
  comments?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Check if user has permission to approve expenses
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        customRole: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const hasApprovalPermission =
      user.role === "ADMIN" ||
      user.role === "GATEKEEPER" ||
      user.customRole?.permissions.some(
        (p: any) => p.permission.key === "APPROVE_EXPENSES"
      );

    if (!hasApprovalPermission) {
      return { error: "Insufficient permissions to approve expenses" };
    }

    // Get expense
    const expense = await (db as any).budgetExpense.findUnique({
      where: { id: expenseId },
      include: {
        budgetAllocation: { include: { project: true } },
        submitter: true,
      },
    });

    if (!expense) {
      return { error: "Expense not found" };
    }

    if (expense.status !== "PENDING") {
      return { error: "Expense has already been processed" };
    }

    // Update expense
    const updatedExpense = await (db as any).budgetExpense.update({
      where: { id: expenseId },
      data: {
        status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    });

    // Update budget allocation spent amount if approved
    if (status === "APPROVED") {
      await (db as any).budgetAllocation.update({
        where: { id: expense.budgetAllocationId },
        data: {
          spentAmount: { increment: expense.amount },
          remainingAmount: { decrement: expense.amount },
        },
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: expense.budgetAllocation.projectId,
        action: `EXPENSE_${status}`,
        details: `Expense ${status.toLowerCase()}: ${expense.description}`,
        metadata: { expenseId: expense.id },
      },
    });

    // Send notification to submitter
    await db.notification.create({
      data: {
        userId: expense.submittedBy,
        type: status === "APPROVED" ? "APPROVAL" : "REJECTION",
        title: `Expense ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `Your expense "${expense.description}" has been ${status.toLowerCase()}`,
        data: {
          projectId: expense.budgetAllocation.projectId,
          expenseId: expense.id,
          amount: expense.amount,
        },
      },
    });

    revalidatePath(`/projects/${expense.budgetAllocation.projectId}`);
    revalidatePath("/admin/budget");

    return { success: true, expense: updatedExpense };
  } catch (error) {
    console.error("Error approving expense:", error);
    return { error: "Failed to process expense" };
  }
}

// Get pending budget approvals
export async function getPendingBudgetApprovals() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Check if user has approval permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        customRole: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const hasApprovalPermission =
      user.role === "ADMIN" ||
      user.role === "GATEKEEPER" ||
      user.customRole?.permissions.some(
        (p: any) => p.permission.key === "APPROVE_BUDGET"
      );

    if (!hasApprovalPermission) {
      return { error: "Insufficient permissions" };
    }

    const pendingAllocations = await (db as any).budgetAllocation.findMany({
      where: { status: "PENDING" },
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingExpenses = await (db as any).budgetExpense.findMany({
      where: { status: "PENDING" },
      include: {
        budgetAllocation: {
          include: {
            project: { select: { id: true, name: true, projectId: true } },
          },
        },
        submitter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      pendingAllocations,
      pendingExpenses,
      totalPending: pendingAllocations.length + pendingExpenses.length,
    };
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return { error: "Failed to fetch pending approvals" };
  }
}
