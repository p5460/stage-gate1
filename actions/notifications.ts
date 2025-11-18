"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type NotificationPreferenceKey =
  | "emailNotifications"
  | "reviewAssignments"
  | "reviewSubmissions"
  | "projectUpdates"
  | "redFlagAlerts"
  | "documentUploads"
  | "statusChanges"
  | "milestoneReminders"
  | "weeklyDigest";

export async function updateNotificationPreferences(preferences: {
  emailNotifications: boolean;
  reviewAssignments: boolean;
  reviewSubmissions: boolean;
  projectUpdates: boolean;
  redFlagAlerts: boolean;
  documentUploads: boolean;
  statusChanges: boolean;
  milestoneReminders: boolean;
  weeklyDigest: boolean;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Upsert notification preferences
    const notificationPreference = await db.notificationPreference.upsert({
      where: { userId: session.user.id! },
      update: preferences,
      create: {
        userId: session.user.id!,
        ...preferences,
      },
    });

    revalidatePath("/settings");
    return { success: true, preferences: notificationPreference };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { error: "Failed to update notification preferences" };
  }
}

export async function getNotificationPreferences() {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const preferences = await db.notificationPreference.findUnique({
      where: { userId: session.user.id! },
    });

    return { success: true, preferences };
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return { error: "Failed to fetch notification preferences" };
  }
}

export async function checkUserNotificationPreference(
  userId: string,
  notificationType: NotificationPreferenceKey
): Promise<boolean> {
  try {
    const preferences = await db.notificationPreference.findUnique({
      where: { userId },
    });

    // If no preferences exist, default to true for most notifications
    if (!preferences) {
      const defaultSettings: Record<NotificationPreferenceKey, boolean> = {
        emailNotifications: true,
        reviewAssignments: true,
        reviewSubmissions: true,
        projectUpdates: true,
        redFlagAlerts: true,
        documentUploads: false,
        statusChanges: true,
        milestoneReminders: true,
        weeklyDigest: false,
      };
      return defaultSettings[notificationType] ?? true;
    }

    // Check if email notifications are enabled first
    if (!preferences.emailNotifications) {
      return false;
    }

    // Return the specific preference
    return preferences[notificationType] ?? true;
  } catch (error) {
    console.error("Error checking notification preference:", error);
    // Default to true if there's an error
    return true;
  }
}
