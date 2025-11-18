import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ActivityClient } from "@/components/activity/activity-client";
import { BackButton } from "@/components/ui/back-button";

export default async function ActivityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Get user to check permissions
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user) {
    redirect("/auth/login");
  }

  // Build query based on user role - admins see all, others see limited
  const whereClause = ["ADMIN", "GATEKEEPER"].includes(user.role)
    ? {} // Admins see all activities
    : {
        OR: [
          { userId: session.user.id }, // Their own activities
          { project: { leadId: session.user.id } }, // Activities on their projects
          { project: { members: { some: { userId: session.user.id } } } }, // Activities on projects they're members of
        ],
      };

  // Fetch activities with related data
  const [activities, activityStats] = await Promise.all([
    db.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            projectId: true,
            status: true,
            currentStage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100 activities
    }),
    db.activityLog.groupBy({
      by: ["action"],
      _count: true,
      where: whereClause,
      orderBy: { _count: { action: "desc" } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600">
            View all system activities and user actions
          </p>
        </div>
      </div>

      <ActivityClient
        activities={activities}
        activityStats={activityStats}
        userRole={user.role}
      />
    </div>
  );
}
