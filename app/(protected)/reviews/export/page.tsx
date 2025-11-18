import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GateReviewsExport } from "@/components/reviews/gate-reviews-export";
import { hasPermission, UserRole } from "@/lib/permissions";
import { BackButton } from "@/components/ui/back-button";

export default async function GateReviewsExportPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to export reviews
  const canExport = hasPermission(
    session.user.role as UserRole,
    "canExportReviews"
  );

  if (!canExport) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to export gate reviews. Only
            administrators, gatekeepers, and project leads can access this
            feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <BackButton href="/reviews" label="Back to Reviews" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Export Gate Reviews
            </h1>
            <p className="text-gray-600 mt-2">
              Export gate review data with customizable filters and multiple
              format options.
            </p>
          </div>
        </div>
      </div>

      <GateReviewsExport />
    </div>
  );
}
