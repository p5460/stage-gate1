-- Add budget allocation and approval functionality

-- Create BudgetAllocation table
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "spentAmount" DOUBLE PRECISION DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- Create BudgetApproval table for approval workflow
CREATE TABLE "BudgetApproval" (
    "id" TEXT NOT NULL,
    "budgetAllocationId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approvedAmount" DOUBLE PRECISION,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetApproval_pkey" PRIMARY KEY ("id")
);

-- Create BudgetExpense table for tracking expenses
CREATE TABLE "BudgetExpense" (
    "id" TEXT NOT NULL,
    "budgetAllocationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetExpense_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BudgetApproval" ADD CONSTRAINT "BudgetApproval_budgetAllocationId_fkey" FOREIGN KEY ("budgetAllocationId") REFERENCES "BudgetAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetApproval" ADD CONSTRAINT "BudgetApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BudgetExpense" ADD CONSTRAINT "BudgetExpense_budgetAllocationId_fkey" FOREIGN KEY ("budgetAllocationId") REFERENCES "BudgetAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetExpense" ADD CONSTRAINT "BudgetExpense_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BudgetExpense" ADD CONSTRAINT "BudgetExpense_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for better performance
CREATE INDEX "BudgetAllocation_projectId_idx" ON "BudgetAllocation"("projectId");
CREATE INDEX "BudgetAllocation_status_idx" ON "BudgetAllocation"("status");
CREATE INDEX "BudgetApproval_budgetAllocationId_idx" ON "BudgetApproval"("budgetAllocationId");
CREATE INDEX "BudgetExpense_budgetAllocationId_idx" ON "BudgetExpense"("budgetAllocationId");

-- Add budget approval permissions
INSERT INTO "Permission" ("id", "key", "name", "description", "category") VALUES
('budget_approve_1', 'APPROVE_BUDGET', 'Approve Budget Allocations', 'Can approve budget allocation requests', 'BUDGET'),
('budget_manage_1', 'MANAGE_BUDGET', 'Manage Project Budgets', 'Can create and manage budget allocations', 'BUDGET'),
('budget_view_1', 'VIEW_BUDGET', 'View Budget Information', 'Can view budget allocations and expenses', 'BUDGET'),
('budget_expense_1', 'APPROVE_EXPENSES', 'Approve Expenses', 'Can approve expense claims', 'BUDGET');