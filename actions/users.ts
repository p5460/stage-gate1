"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  canChangeUserRoles,
  canManageUsers,
  UserRole,
} from "@/lib/permissions";

export async function getAllUsers() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to view all users
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    return { error: "Unauthorized to view users" };
  }

  try {
    // Get basic user data with counts
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projectsLed: true,
            projectMembers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Try to get custom roles if available
    let customRoles: any[] = [];
    try {
      customRoles = await db.customRole.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          color: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
      });
    } catch (customRoleError) {
      console.warn("Custom roles not available:", customRoleError);
      customRoles = [];
    }

    return { success: true, users, customRoles };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Failed to fetch users" };
  }
}

export async function updateUserRole(userId: string, role: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to update roles
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!currentUser || !canChangeUserRoles(currentUser.role as UserRole)) {
    return { error: "Unauthorized to update user roles" };
  }

  // Prevent users from changing their own role
  if (currentUser.id === userId) {
    return { error: "You cannot change your own role" };
  }

  try {
    const user = await db.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "USER_ROLE_UPDATED",
        details: `User ${user.name} role updated to ${role}`,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { error: "Failed to update user role" };
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    department?: string;
    position?: string;
    phone?: string;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Users can only update their own profile unless they're admin
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (userId !== session.user.id && currentUser?.role !== "ADMIN") {
    return { error: "Unauthorized to update this profile" };
  }

  try {
    const user = await db.user.update({
      where: { id: userId },
      data,
    });

    revalidatePath("/settings");
    revalidatePath("/admin/users");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { error: "Failed to update user profile" };
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  position?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to create users
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Unauthorized to create users" };
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await db.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: data.role as any,
        emailVerified: new Date(), // Auto-verify admin-created users
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "USER_CREATED",
        details: `New user ${user.name} created with role ${user.role}`,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user" };
  }
}

export async function deleteUser(userId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to delete users
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Unauthorized to delete users" };
  }

  // Prevent deleting self
  if (userId === session.user.id) {
    return { error: "Cannot delete your own account" };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        projectsLed: true,
        projectMembers: true,
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if user has active projects
    if (user.projectsLed.length > 0) {
      return { error: "Cannot delete user who is leading active projects" };
    }

    await db.user.delete({
      where: { id: userId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "USER_DELETED",
        details: `User ${user.name} was deleted`,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error: "Failed to delete user" };
  }
}

export async function toggleUserStatus(userId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    return { error: "Unauthorized to toggle user status" };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Toggle email verification status as a way to enable/disable users
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        emailVerified: user.emailVerified ? null : new Date(),
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "USER_STATUS_TOGGLED",
        details: `User ${user.name} status changed to ${updatedUser.emailVerified ? "active" : "inactive"}`,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { error: "Failed to toggle user status" };
  }
}
