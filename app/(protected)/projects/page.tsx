import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectsHeader } from "@/components/projects/projects-header";
import { ProjectsGrid } from "@/components/projects/projects-grid";
import { ProjectsTable } from "@/components/projects/projects-table";
import { ProjectFilters } from "@/components/projects/project-filters";

interface ProjectsPageProps {
  searchParams: Promise<{
    view?: string;
    search?: string;
    cluster?: string;
    stage?: string;
    status?: string;
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const { view = "grid", search, cluster, stage, status } = await searchParams;

  // Build where clause for filtering
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { projectId: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (cluster) {
    where.cluster = { name: cluster };
  }

  if (stage) {
    where.currentStage = stage;
  }

  if (status) {
    where.status = status;
  }

  const [projects, clusters] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        lead: true,
        cluster: true,
        _count: {
          select: {
            documents: true,
            redFlags: { where: { status: "OPEN" } },
            members: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.cluster.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <ProjectsHeader clusters={clusters} projects={projects} />

      <ProjectFilters
        clusters={clusters}
        currentFilters={{ view, search, cluster, stage, status }}
      />

      {view === "grid" ? (
        <ProjectsGrid projects={projects} />
      ) : (
        <ProjectsTable projects={projects} />
      )}
    </div>
  );
}
