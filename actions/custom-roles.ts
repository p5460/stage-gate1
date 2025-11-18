"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageUsers, UserRole } from "@/lib/permissions";

export async function getAllCustomRoles() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    return { error: "Unauthorized to view custom roles" };
  }

  try {
    const customRoles = await db.customRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, customRoles };
  } catch (error) {
    console.error("Error fetching custom roles:", error);
    return { error: "Failed to fetch custom roles" };
  }
}

export async function getAllPermissions() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    return { error: "Unauthorized to view permissions" };
  }

  try {
    const permissions = await db.permission.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return { success: true, permissions };
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return { error: "Failed to fetch permissions" };
  }
}

export async function createCustomRole(data: {
  name: string;
  description?: string;
  color?: string;
  permissionIds: string[];
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    return { error: "Unauthorized to create custom roles" };
  }

  try {
    // Check if role name already exists
    const existingRole = await db.customRole.findUnique({
      where: { name: data.name },
    });

    if (existingRole) {
      return { error: "Role name already exists" };
    }

    // Create the custom role
    const customRole = await db.customRole.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || "#6B7280",
        isActive: true,
      },
    });

    // Add permissions to the role
    if (data.permissionIds.length > 0) {
      await db.customRolePermission.createMany({
        data: data.permissionIds.map((permissionId) => ({
          customRoleId: customRole.id,
          permissionId,
        })),
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CUSTOM_ROLE_CREATED",
        details: `Custom role "${data.name}" created with ${data.permissionIds.length} permissions`,
      },
    });

    revalidatePath("/admin/roles");
    return { success: true, customRole };
  } catch (error) {
    console.error("Error creating custom role:", error);
    return { error: "Failed to create custom role" };
  }
}

export async function updateCustomRole(
  roleId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    permissionIds?: string[];
    isActive?: boolean;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    return { error: "Unauthorized to update custom roles" };
  }

  try {
    // Check if new name conflicts with existing role
    if (data.name) {
      const existingRole = await db.customRole.findFirst({
        where: {
          name: data.name,
          id: { not: roleId },
        },
      });

      if (existingRole) {
        return { error: "Role name already exists" };
      }
    }

    // Update the custom role
    const customRole = await db.customRole.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        isActive: data.isActive,
      },
    });

    // Update permissions if provided
    if (data.permissionIds) {
      // Remove existing permissions
      await db.customRolePermission.deleteMany({
        where: { customRoleId: roleId },
      });

      // Add new permissions
      if (data.permissionIds.length > 0) {
        await db.customRolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            customRoleId: roleId,
            permissionId,
          })),
        });
      }
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CUSTOM_ROLE_UPDATED",
        details: `Custom role "${customRole.name}" updated`,
      },
    });

    revalidatePath("/admin/roles");
    return { success: true, customRole };
  } catch (error) {
    console.error("Error updating custom role:", error);
    return { error: "Failed to update custom role" };
  }
}

export async function deleteCustomRole(roleId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    return { error: "Unauthorized to delete custom roles" };
  }

  try {
    // Check if role is in use
    const usersWithRole = await db.user.count({
      where: { customRoleId: roleId },
    });

    if (usersWithRole > 0) {
      return {
        error: `Cannot delete role. ${usersWithRole} users are assigned to this role.`,
      };
    }

    // Get role name for logging
    const role = await db.customRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return { error: "Role not found" };
    }

    // Delete the custom role (permissions will be deleted by cascade)
    await db.customRole.delete({
      where: { id: roleId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CUSTOM_ROLE_DELETED",
        details: `Custom role "${role.name}" deleted`,
      },
    });

    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error) {
    console.error("Error deleting custom role:", error);
    return { error: "Failed to delete custom role" };
  }
}

export async function assignCustomRoleToUser(
  userId: string,
  customRoleId: string | null
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    return { error: "Unauthorized to assign roles" };
  }

  try {
    // Update user role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: customRoleId ? "CUSTOM" : "USER",
        customRoleId: customRoleId,
      },
      include: {
        customRole: true,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "USER_ROLE_ASSIGNED",
        details: customRoleId
          ? `Custom role "${updatedUser.customRole?.name}" assigned to user`
          : "Custom role removed from user",
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/roles");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error assigning custom role:", error);
    return { error: "Failed to assign custom role" };
  }
}

export async function duplicateCustomRole(roleId: string, newName: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    return { error: "Unauthorized to duplicate custom roles" };
  }

  try {
    // Get the original role with permissions
    const originalRole = await db.customRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
      },
    });

    if (!originalRole) {
      return { error: "Original role not found" };
    }

    // Check if new name already exists
    const existingRole = await db.customRole.findUnique({
      where: { name: newName },
    });

    if (existingRole) {
      return { error: "Role name already exists" };
    }

    // Create the duplicate role
    const duplicateRole = await db.customRole.create({
      data: {
        name: newName,
        description: `Copy of ${originalRole.name}`,
        color: originalRole.color,
        isActive: true,
      },
    });

    // Copy permissions
    if (originalRole.permissions.length > 0) {
      await db.customRolePermission.createMany({
        data: originalRole.permissions.map((rp: any) => ({
          customRoleId: duplicateRole.id,
          permissionId: rp.permissionId,
        })),
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CUSTOM_ROLE_DUPLICATED",
        details: `Custom role "${originalRole.name}" duplicated as "${newName}"`,
      },
    });

    revalidatePath("/admin/roles");
    return { success: true, customRole: duplicateRole };
  } catch (error) {
    console.error("Error duplicating custom role:", error);
    return { error: "Failed to duplicate custom role" };
  }
}
