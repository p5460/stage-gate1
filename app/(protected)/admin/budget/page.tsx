import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BudgetManagementClient } from "@/components/budget/budget-management-client";

export default async function BudgetManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has budget management permissions
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

  const hasPermission =
    user.role === "ADMIN" ||
    user.role === "GATEKEEPER" ||
    user.customRole?.permissions.some((p: any) =>
      ["APPROVE_BUDGET", "MANAGE_BUDGET", "APPROVE_EXPENSES"].includes(
        p.permission.key
      )
    );

  if (!hasPermission) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Budget Management
          </h1>
          <p className="text-muted-foreground">
            Manage budget allocations and expense approvals across all projects.
          </p>
        </div>

        <Suspense fallback={<div>Loading budget management...</div>}>
          <BudgetManagementClient />
        </Suspense>
      </div>
    </div>
  );
}
