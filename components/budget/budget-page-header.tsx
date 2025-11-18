"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

interface BudgetPageHeaderProps {
  hasAdminPermission: boolean;
  hasProjectLeadAccess: boolean;
}

export function BudgetPageHeader({
  hasAdminPermission,
  hasProjectLeadAccess,
}: BudgetPageHeaderProps) {
  const handleExport = () => {
    window.open("/api/budget/export?type=summary&format=csv", "_blank");
  };

  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {hasAdminPermission ? "Budget Management" : "My Budget"}
        </h1>
        <p className="text-muted-foreground">
          {hasAdminPermission
            ? "Manage budget allocations and expense approvals across all projects."
            : "Manage your project budgets, allocations, and expense claims."}
        </p>
      </div>

      <div className="flex gap-2">
        {hasProjectLeadAccess && (
          <Link href="/budget/request">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Budget
            </Button>
          </Link>
        )}

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Budget
        </Button>
      </div>
    </div>
  );
}
