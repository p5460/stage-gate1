"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import * as z from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function updateProfile(data: z.infer<typeof profileUpdateSchema>) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Validate input
    const validatedData = profileUpdateSchema.parse(data);

    // Check if email is already taken by another user
    if (validatedData.email !== session.user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return { error: "Email is already in use by another account" };
      }
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user.id! },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        department: validatedData.department,
        position: validatedData.position,
        phone: validatedData.phone,
        // bio: validatedData.bio, // TODO: Add bio field support
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "PROFILE_UPDATED",
        details: "User profile information updated",
      },
    });

    revalidatePath("/settings");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Profile update error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(
  data: z.infer<typeof passwordChangeSchema>
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Validate input
    const validatedData = passwordChangeSchema.parse(data);

    // Get current user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      return { error: "Password change not available for OAuth accounts" };
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return { error: "Current password is incorrect" };
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: session.user.id! },
      data: { password: hashedNewPassword },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "PASSWORD_CHANGED",
        details: "User password changed successfully",
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Password change error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to change password" };
  }
}

export async function enableTwoFactor() {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Update user to enable 2FA
    await db.user.update({
      where: { id: session.user.id! },
      data: { isTwoFactorEnabled: true },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "TWO_FACTOR_ENABLED",
        details: "Two-factor authentication enabled",
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("2FA enable error:", error);
    return { error: "Failed to enable two-factor authentication" };
  }
}

export async function disableTwoFactor() {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Update user to disable 2FA
    await db.user.update({
      where: { id: session.user.id! },
      data: { isTwoFactorEnabled: false },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "TWO_FACTOR_DISABLED",
        details: "Two-factor authentication disabled",
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("2FA disable error:", error);
    return { error: "Failed to disable two-factor authentication" };
  }
}

export async function getUserProfile() {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        // bio: true, // TODO: Add bio field support
        isTwoFactorEnabled: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projectsLed: true,
            projectMembers: true,
            gateReviews: true,
          },
        },
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Get profile error:", error);
    return { error: "Failed to get user profile" };
  }
}

export async function getUserActivityLog(limit: number = 10) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const activities = await db.activityLog.findMany({
      where: { userId: session.user.id! },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
      },
    });

    return { success: true, activities };
  } catch (error) {
    console.error("Get activity log error:", error);
    return { error: "Failed to get activity log" };
  }
}
