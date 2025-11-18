import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { BackButton } from "@/components/ui/back-button";
import { hasPermission, UserRole } from "@/lib/permissions";

export default async function CreateProjectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to create projects
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const canCreateProject = hasPermission(
    user.role as UserRole,
    "canCreateProjects"
  );

  if (!canCreateProject) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to create projects. Only administrators,
            gatekeepers, and project leads can create new projects.
          </p>
        </div>
      </div>
    );
  }

  // Get clusters for the form
  const clusters = await db.cluster.findMany({
    orderBy: { name: "asc" },
  });

  // Get potential team members (all users except current user)
  const users = await db.user.findMany({
    where: {
      id: { not: session.user.id },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      position: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/projects" label="Back to Projects" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Project
          </h1>
          <p className="text-gray-600 mt-2">
            Set up a new project with team members, documents, and milestones
          </p>
        </div>
      </div>

      <CreateProjectForm clusters={clusters} users={users} currentUser={user} />
    </div>
  );
}
