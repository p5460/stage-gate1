import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectSummary } from "@/components/projects/project-summary";
import { ProjectProgress } from "@/components/projects/project-progress";
import { StageNavigation } from "@/components/projects/stage-navigation";
import ProjectTabs from "@/components/projects/project-tabs";

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  const [project, availableUsers, clusters] = await Promise.all([
    db.project.findUnique({
      where: { id },
      include: {
        lead: true,
        cluster: true,
        members: {
          include: {
            user: true,
          },
        },
        gateReviews: {
          include: {
            reviewer: true,
          },
          orderBy: { createdAt: "desc" },
        },
        documents: {
          include: {
            uploader: true,
          },
          orderBy: { createdAt: "desc" },
        },
        redFlags: {
          include: {
            raisedBy: true,
          },
          orderBy: { createdAt: "desc" },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
        },
        activities: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      where: {
        emailVerified: { not: null },
      },
    }),
    db.cluster.findMany({
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!project) {
    notFound();
  }

  // Filter out users with null names or emails and properly type them
  const validUsers = availableUsers
    .filter((user: any) => user.name && user.email)
    .map((user: any) => ({
      id: user.id,
      name: user.name as string,
      email: user.email as string,
      role: user.role,
      department: user.department,
    }));

  // Filter users who can be reviewers
  const reviewers = validUsers.filter((user: any) =>
    ["ADMIN", "GATEKEEPER", "REVIEWER"].includes(user.role)
  );

  // Get current user details
  const currentUser = validUsers.find(
    (user: any) => user.id === session.user.id
  );

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        clusters={clusters}
        users={validUsers}
        reviewers={reviewers}
        currentUser={
          currentUser
            ? {
                id: currentUser.id,
                role: currentUser.role,
              }
            : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectSummary project={project} />
        </div>
        <div>
          <ProjectProgress project={project} />
        </div>
      </div>

      <StageNavigation project={project} />

      <ProjectTabs
        project={project}
        documents={project.documents}
        gateReviews={project.gateReviews}
        redFlags={project.redFlags}
        members={project.members}
        activities={project.activities}
        availableUsers={availableUsers}
        currentUser={
          currentUser
            ? {
                id: currentUser.id,
                role: currentUser.role,
              }
            : undefined
        }
      />
    </div>
  );
}
