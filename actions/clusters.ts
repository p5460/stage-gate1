"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getAllClusters() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const clusters = await db.cluster.findMany({
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, clusters };
  } catch (error) {
    console.error("Error fetching clusters:", error);
    return { error: "Failed to fetch clusters" };
  }
}

export async function createCluster(data: {
  name: string;
  description?: string;
  color?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to create clusters
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
    return { error: "Unauthorized to create clusters" };
  }

  try {
    // Check if cluster already exists
    const existingCluster = await db.cluster.findUnique({
      where: { name: data.name },
    });

    if (existingCluster) {
      return { error: "Cluster with this name already exists" };
    }

    const cluster = await db.cluster.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || "#3B82F6",
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CLUSTER_CREATED",
        details: `New cluster ${cluster.name} created`,
      },
    });

    revalidatePath("/admin/clusters");
    revalidatePath("/projects");
    return { success: true, cluster };
  } catch (error) {
    console.error("Error creating cluster:", error);
    return { error: "Failed to create cluster" };
  }
}

export async function updateCluster(
  clusterId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to update clusters
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
    return { error: "Unauthorized to update clusters" };
  }

  try {
    const cluster = await db.cluster.update({
      where: { id: clusterId },
      data,
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CLUSTER_UPDATED",
        details: `Cluster ${cluster.name} was updated`,
      },
    });

    revalidatePath("/admin/clusters");
    revalidatePath("/projects");
    return { success: true, cluster };
  } catch (error) {
    console.error("Error updating cluster:", error);
    return { error: "Failed to update cluster" };
  }
}

export async function deleteCluster(clusterId: string, force: boolean = false) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to delete clusters
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized to delete clusters" };
  }

  try {
    const cluster = await db.cluster.findUnique({
      where: { id: clusterId },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!cluster) {
      return { error: "Cluster not found" };
    }

    // Check if cluster has active projects
    if (cluster.projects.length > 0 && !force) {
      return {
        error: "Cannot delete cluster with active projects",
        projectCount: cluster.projects.length,
        projects: cluster.projects,
      };
    }

    // If force delete, we need to handle projects first
    if (force && cluster.projects.length > 0) {
      // For now, we'll prevent force delete if there are active projects
      // Force delete: reassign projects to a default cluster or delete them
      if (force) {
        // First, try to find a default cluster to reassign projects
        const defaultCluster = await db.cluster.findFirst({
          where: { name: "General" },
        });

        if (defaultCluster && defaultCluster.id !== clusterId) {
          // Reassign projects to default cluster
          await db.project.updateMany({
            where: { clusterId },
            data: { clusterId: defaultCluster.id },
          });
        } else {
          // If no default cluster, we need to handle this case
          // For now, we'll prevent deletion if there's no alternative
          return {
            error:
              "Cannot force delete: No alternative cluster found for project reassignment",
            projectCount: cluster.projects.length,
            projects: cluster.projects,
          };
        }
      } else {
        return {
          error:
            "Cannot delete cluster with active projects. Use force delete to reassign projects.",
          projectCount: cluster.projects.length,
          projects: cluster.projects,
        };
      }
    }

    await db.cluster.delete({
      where: { id: clusterId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CLUSTER_DELETED",
        details: `Cluster ${cluster.name} was deleted`,
      },
    });

    revalidatePath("/admin/clusters");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting cluster:", error);
    return { error: "Failed to delete cluster" };
  }
}

export async function getClusterById(clusterId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const cluster = await db.cluster.findUnique({
      where: { id: clusterId },
      include: {
        projects: {
          select: {
            id: true,
            projectId: true,
            name: true,
            status: true,
            currentStage: true,
            lead: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!cluster) {
      return { error: "Cluster not found" };
    }

    return { success: true, cluster };
  } catch (error) {
    console.error("Error fetching cluster:", error);
    return { error: "Failed to fetch cluster" };
  }
}

export async function reassignProjectsToCluster(
  fromClusterId: string,
  toClusterId: string,
  projectIds?: string[]
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
    return { error: "Unauthorized to reassign projects" };
  }

  try {
    // Verify both clusters exist
    const [fromCluster, toCluster] = await Promise.all([
      db.cluster.findUnique({ where: { id: fromClusterId } }),
      db.cluster.findUnique({ where: { id: toClusterId } }),
    ]);

    if (!fromCluster || !toCluster) {
      return { error: "One or both clusters not found" };
    }

    // Build where clause for projects to reassign
    const whereClause =
      projectIds && projectIds.length > 0
        ? { clusterId: fromClusterId, id: { in: projectIds } }
        : { clusterId: fromClusterId };

    // Get projects to be reassigned for logging
    const projectsToReassign = await db.project.findMany({
      where: whereClause,
      select: { id: true, name: true },
    });

    // Reassign projects
    const result = await db.project.updateMany({
      where: whereClause,
      data: { clusterId: toClusterId },
    });

    // Create activity logs
    for (const project of projectsToReassign) {
      await db.activityLog.create({
        data: {
          userId: session.user.id!,
          projectId: project.id,
          action: "PROJECT_CLUSTER_REASSIGNED",
          details: `Project reassigned from ${fromCluster.name} to ${toCluster.name}`,
        },
      });
    }

    // Create cluster activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CLUSTER_PROJECTS_REASSIGNED",
        details: `${result.count} projects reassigned from ${fromCluster.name} to ${toCluster.name}`,
      },
    });

    revalidatePath("/admin/clusters");
    revalidatePath("/projects");
    return {
      success: true,
      reassignedCount: result.count,
      fromCluster: fromCluster.name,
      toCluster: toCluster.name,
    };
  } catch (error) {
    console.error("Error reassigning projects:", error);
    return { error: "Failed to reassign projects" };
  }
}
