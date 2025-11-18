import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ProjectStagesChart } from "@/components/dashboard/project-stages-chart";
import { DecisionDistribution } from "@/components/dashboard/decision-distribution";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { RecentComments } from "@/components/dashboard/recent-comments";
import { RecentRedFlags } from "@/components/dashboard/recent-red-flags";

import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch dashboard data
  const [
    totalProjects,
    pendingReviews,
    redFlags,
    recentProjects,
    projectsByStage,
    recentActivities,
  ] = await Promise.all([
    db.project.count({ where: { status: "ACTIVE" } }),
    db.gateReview.count({ where: { isCompleted: false } }),
    db.redFlag.count({ where: { status: "OPEN" } }),
    db.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        lead: true,
        cluster: true,
        _count: {
          select: {
            documents: true,
            redFlags: { where: { status: "OPEN" } },
          },
        },
      },
    }),
    db.project.groupBy({
      by: ["currentStage"],
      _count: true,
    }),
    db.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        project: true,
      },
    }),
  ]);

  const stats = {
    activeProjects: totalProjects,
    pendingReviews,
    redFlags,
    approvalRate: 78, // This would be calculated from actual gate review data
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session.user.name}</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="grid grid-cols-1 gap-6">
          <RecentActivity activities={recentActivities} />
          <RecentComments />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <RecentRedFlags />
          <div className="p-6 bg-white rounded-lg shadow">
            <ProjectStagesChart data={projectsByStage} />
            <DecisionDistribution />
          </div>
        </div>
      </div>

      <RecentProjects projects={recentProjects} />
    </div>
  );
}
