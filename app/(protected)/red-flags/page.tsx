import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RedFlagsClient } from "@/components/red-flags/red-flags-client";
import { BackButton } from "@/components/ui/back-button";

export default async function RedFlagsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Get user's role to determine what red flags they can see
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  // Build query based on user role
  const whereClause =
    user?.role === "ADMIN" || user?.role === "GATEKEEPER"
      ? {} // Admins and gatekeepers can see all red flags
      : {
          OR: [
            { raisedById: session.user.id }, // Red flags they raised
            { project: { leadId: session.user.id } }, // Red flags on their projects
            { project: { members: { some: { userId: session.user.id } } } }, // Red flags on projects they're members of
          ],
        };

  const [redFlags, redFlagStats] = await Promise.all([
    db.redFlag.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            lead: true,
            cluster: true,
          },
        },
        raisedBy: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.redFlag.groupBy({
      by: ["status", "severity"],
      _count: true,
      where: whereClause,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Red Flags</h1>
          <p className="text-gray-600">Monitor and manage project issues</p>
        </div>
      </div>
      <RedFlagsClient
        redFlags={redFlags}
        redFlagStats={redFlagStats}
        userRole={user?.role || "USER"}
      />
    </div>
  );
}
