"use client";

import { useRouter } from "next/navigation";
import { BudgetAllocationForm } from "@/components/budget/budget-allocation-form";

interface Project {
  id: string;
  name: string;
  projectId: string;
  budget: number | null;
  budgetUtilization: number | null;
}

interface BudgetRequestPageClientProps {
  projects: Project[];
}

export function BudgetRequestPageClient({
  projects,
}: BudgetRequestPageClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect back to budget page after successful submission
    router.push("/budget");
  };

  return (
    <div className="max-w-2xl">
      {projects.length > 0 ? (
        <BudgetAllocationForm
          projectId={projects[0].id}
          onSuccess={handleSuccess}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No projects available for budget requests.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Contact your administrator to be assigned to a project.
          </p>
        </div>
      )}
    </div>
  );
}
