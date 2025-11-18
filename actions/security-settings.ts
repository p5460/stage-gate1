"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !user.password) {
      return { error: "User not found or using OAuth login" };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return { error: "Current password is incorrect" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: session.user.id! },
      data: {
        password: hashedPassword,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { error: "Failed to change password" };
  }
}

export async function toggleTwoFactor(enabled: boolean) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    await db.user.update({
      where: { id: session.user.id! },
      data: {
        isTwoFactorEnabled: enabled,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error toggling two-factor authentication:", error);
    return { error: "Failed to update two-factor authentication" };
  }
}

export async function logoutAllDevices() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // In a real implementation, you would invalidate all sessions
    // For now, we'll just update a timestamp that can be used to invalidate sessions
    await db.user.update({
      where: { id: session.user.id! },
      data: {
        updatedAt: new Date(),
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error logging out all devices:", error);
    return { error: "Failed to logout all devices" };
  }
}
