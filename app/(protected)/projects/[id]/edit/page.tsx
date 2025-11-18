import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EditProjectForm } from "@/components/projects/edit-project-form";
import { BackButton } from "@/components/ui/back-button";
import { hasPermission, UserRole } from "@/lib/permissions";

interface EditProjectPageProps {
  params: {
    id: string;
  };
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Await params for Next.js 15 compatibility
  const { id } = await params;

  // Get current user
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user) {
    redirect("/auth/login");
  }

  // Get the project with all related data
  const project = await db.project.findUnique({
    where: { id },
    include: {
      cluster: true,
      lead: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              department: true,
              position: true,
            },
          },
        },
      },
      documents: {
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      milestones: {
        orderBy: { dueDate: "asc" },
      },
      redFlags: {
        include: {
          raisedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Project Not Found
          </h1>
          <p className="text-gray-600">
            The project you're looking for doesn't exist or you don't have
            access to it.
          </p>
        </div>
      </div>
    );
  }

  // Check if user has permission to edit this project
  const canEdit =
    hasPermission(user.role as UserRole, "canManageAllProjects") ||
    (hasPermission(user.role as UserRole, "canCreateProjects") &&
      project.leadId === user.id);

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to edit this project. Only administrators,
            gatekeepers, and the project lead can edit project details.
          </p>
        </div>
      </div>
    );
  }

  // Get clusters for the form
  const clusters = await db.cluster.findMany({
    orderBy: { name: "asc" },
  });

  // Get potential team members (all users except current project lead)
  const users = await db.user.findMany({
    where: {
      id: { not: project.leadId },
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
        <BackButton href={`/projects/${id}`} label="Back to Project" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-600 mt-2">
            Update project details, manage team members, documents, and
            milestones
          </p>
          <div className="text-sm text-gray-500 mt-1">
            {project.name} ({project.projectId})
          </div>
        </div>
      </div>

      <EditProjectForm
        project={project}
        clusters={clusters}
        users={users}
        currentUser={user}
      />
    </div>
  );
}
