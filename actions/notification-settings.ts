"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface NotificationSettings {
  emailNotifications: boolean;
  reviewAssignments?: boolean;
  reviewSubmissions?: boolean;
  projectUpdates: boolean;
  redFlagAlerts?: boolean;
  documentUploads: boolean;
  statusChanges?: boolean;
  milestoneReminders?: boolean;
  weeklyDigest?: boolean;
}

export async function updateNotificationSettings(
  settings: NotificationSettings
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Update or create notification settings
    await db.user.update({
      where: { id: session.user.id! },
      data: {
        notificationPreference: {
          upsert: {
            create: {
              emailNotifications: settings.emailNotifications,
              reviewAssignments: settings.reviewAssignments || true,
              reviewSubmissions: settings.reviewSubmissions || true,
              projectUpdates: settings.projectUpdates,
              redFlagAlerts: settings.redFlagAlerts || true,
              documentUploads: settings.documentUploads,
              statusChanges: settings.statusChanges || true,
              milestoneReminders: settings.milestoneReminders || true,
              weeklyDigest: settings.weeklyDigest || false,
            },
            update: {
              emailNotifications: settings.emailNotifications,
              reviewAssignments: settings.reviewAssignments || true,
              reviewSubmissions: settings.reviewSubmissions || true,
              projectUpdates: settings.projectUpdates,
              redFlagAlerts: settings.redFlagAlerts || true,
              documentUploads: settings.documentUploads,
              statusChanges: settings.statusChanges || true,
              milestoneReminders: settings.milestoneReminders || true,
              weeklyDigest: settings.weeklyDigest || false,
            },
          },
        },
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return { error: "Failed to update notification settings" };
  }
}

export async function getNotificationSettings() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
      include: {
        notificationPreference: true,
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Return default settings if none exist
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      projectUpdates: true,
      gateReviews: true,
      redFlags: true,
      comments: true,
      documentUploads: false,
      teamInvitations: true,
      frequency: "immediate",
      quietHours: false,
      quietStart: "22:00",
      quietEnd: "08:00",
    };

    return {
      success: true,
      settings: user.notificationPreference || defaultSettings,
    };
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return { error: "Failed to fetch notification settings" };
  }
}
