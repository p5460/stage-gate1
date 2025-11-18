"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await getUserById(user.id!);
  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" };
    }

    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return { success: "Verification email sent!" };
  }

  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(
      values.password,
      dbUser.password
    );

    if (!passwordsMatch) {
      return { error: "Incorrect password!" };
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10);
    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...values,
    },
  });

  return { success: "Settings Updated!" };
};
export async function updateProfile(data: {
  name?: string;
  department?: string;
  position?: string;
  phone?: string;
}) {
  const user = await currentUser();

  if (!user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data,
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "PROFILE_UPDATED",
        details: "Profile information updated",
      },
    });

    return { success: "Profile updated successfully!" };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }
}

export async function updateNotificationSettings(settings: {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  projectUpdates?: boolean;
  gateReviews?: boolean;
  redFlags?: boolean;
  comments?: boolean;
  frequency?: "immediate" | "daily" | "weekly";
}) {
  const user = await currentUser();

  if (!user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Store notification settings in user preferences
    await db.settings.upsert({
      where: { key: `notifications_${user.id}` },
      update: {
        value: JSON.stringify(settings),
        type: "JSON",
      },
      create: {
        key: `notifications_${user.id}`,
        value: JSON.stringify(settings),
        type: "JSON",
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "NOTIFICATION_SETTINGS_UPDATED",
        details: "Notification preferences updated",
      },
    });

    return { success: "Notification settings updated!" };
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return { error: "Failed to update notification settings" };
  }
}

export async function updateSecuritySettings(data: {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  twoFactorEnabled?: boolean;
}) {
  const user = await currentUser();

  if (!user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const dbUser = await getUserById(user.id);

    if (!dbUser) {
      return { error: "User not found" };
    }

    // Handle password change
    if (data.currentPassword && data.newPassword) {
      if (!dbUser.password) {
        return { error: "Cannot change password for OAuth users" };
      }

      const isValidPassword = await bcrypt.compare(
        data.currentPassword,
        dbUser.password
      );

      if (!isValidPassword) {
        return { error: "Current password is incorrect" };
      }

      if (data.newPassword !== data.confirmPassword) {
        return { error: "New passwords do not match" };
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 12);

      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    // Handle 2FA toggle
    if (data.twoFactorEnabled !== undefined) {
      await db.user.update({
        where: { id: user.id },
        data: { isTwoFactorEnabled: data.twoFactorEnabled },
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "SECURITY_SETTINGS_UPDATED",
        details: "Security settings updated",
      },
    });

    return { success: "Security settings updated!" };
  } catch (error) {
    console.error("Error updating security settings:", error);
    return { error: "Failed to update security settings" };
  }
}

export async function getNotificationSettings() {
  const user = await currentUser();

  if (!user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const settings = await db.settings.findUnique({
      where: { key: `notifications_${user.id}` },
    });

    if (!settings) {
      // Return default settings
      return {
        success: true,
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          projectUpdates: true,
          gateReviews: true,
          redFlags: true,
          comments: true,
          frequency: "immediate",
        },
      };
    }

    return {
      success: true,
      settings: JSON.parse(settings.value),
    };
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return { error: "Failed to fetch notification settings" };
  }
}
