import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BudgetRequestPageClient } from "@/components/budget/budget-request-page-client";

export default async function RequestBudgetAllocationPage() {
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

  // Check if user can request budget allocations
  const canRequestBudget =
    user.role === "PROJECT_LEAD" ||
    user.role === "ADMIN" ||
    user.customRole?.permissions.some(
      (p: any) => p.permission.key === "MANAGE_BUDGET"
    );

  if (!canRequestBudget) {
    redirect("/dashboard");
  }

  // Get user's projects
  const projects = await db.project.findMany({
    where: {
      OR: [
        { leadId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    select: {
      id: true,
      name: true,
      projectId: true,
      budget: true,
      budgetUtilization: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Request Budget Allocation
          </h1>
          <p className="text-muted-foreground">
            Submit a new budget allocation request for your project.
          </p>
        </div>

        <Suspense fallback={<div>Loading request form...</div>}>
          <BudgetRequestPageClient projects={projects} />
        </Suspense>
      </div>
    </div>
  );
}
