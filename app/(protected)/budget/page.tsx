import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectLeadBudgetDashboard } from "@/components/budget/project-lead-budget-dashboard";
import { BudgetManagementClient } from "@/components/budget/budget-management-client";
import { BudgetPageHeader } from "@/components/budget/budget-page-header";

export default async function BudgetPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Get user with role information
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
    redirect("/auth/login");
  }

  // Check if user has any budget-related permissions
  const hasAdminPermission =
    user.role === "ADMIN" ||
    user.role === "GATEKEEPER" ||
    user.customRole?.permissions.some((p: any) =>
      ["APPROVE_BUDGET", "MANAGE_BUDGET", "APPROVE_EXPENSES"].includes(
        p.permission.key
      )
    );

  const hasProjectLeadAccess = user.role === "PROJECT_LEAD";

  // If no budget access at all, redirect
  if (!hasAdminPermission && !hasProjectLeadAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <BudgetPageHeader
          hasAdminPermission={hasAdminPermission}
          hasProjectLeadAccess={hasProjectLeadAccess}
        />

        <Suspense fallback={<div>Loading budget dashboard...</div>}>
          {hasAdminPermission ? (
            <BudgetManagementClient />
          ) : (
            <ProjectLeadBudgetDashboard />
          )}
        </Suspense>
      </div>
    </div>
  );
}
