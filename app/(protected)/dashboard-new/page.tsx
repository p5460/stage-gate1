import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Dashboard01 } from "@/components/dashboard/dashboard-01";
import { BackButton } from "@/components/ui/back-button";

export default async function DashboardNewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Dashboard</h1>
          <p className="text-gray-600">Alternative dashboard view</p>
        </div>
      </div>
      <Dashboard01 user={session.user} />
    </div>
  );
}
