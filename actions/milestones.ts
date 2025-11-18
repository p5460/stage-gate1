"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendMilestoneCompletedNotification } from "@/lib/notifications";

export async function createMilestone(
  projectId: string,
  title: string,
  description: string,
  dueDate: Date
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const milestone = await db.milestone.create({
      data: {
        projectId,
        title,
        description,
        dueDate,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId,
        action: "MILESTONE_CREATED",
        details: `Milestone "${title}" created`,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, milestone };
  } catch (error) {
    console.error("Error creating milestone:", error);
    return { error: "Failed to create milestone" };
  }
}

export async function updateMilestone(
  milestoneId: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    isCompleted?: boolean;
    progress?: number;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const milestone = await db.milestone.update({
      where: { id: milestoneId },
      data: {
        ...data,
        completedAt: data.isCompleted ? new Date() : null,
      },
      include: {
        project: {
          include: {
            lead: true,
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: milestone.projectId,
        action: data.isCompleted ? "MILESTONE_COMPLETED" : "MILESTONE_UPDATED",
        details: `Milestone "${milestone.title}" ${data.isCompleted ? "completed" : "updated"}`,
      },
    });

    // Send email notifications for milestone completion
    if (data.isCompleted) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const projectUrl = `${baseUrl}/projects/${milestone.projectId}`;

        const user = await db.user.findUnique({
          where: { id: session.user.id! },
          select: { name: true, email: true },
        });

        const recipients = [
          { id: milestone.project.leadId, email: milestone.project.lead.email },
          ...milestone.project.members.map((m: any) => ({
            id: m.userId,
            email: m.user.email,
          })),
        ].filter((r) => r.email && r.id !== session.user.id) as {
          id: string;
          email: string;
        }[];

        if (recipients.length > 0) {
          await sendMilestoneCompletedNotification(
            {
              projectName: milestone.project.name,
              projectId: milestone.project.projectId,
              milestoneName: milestone.title,
              completedBy: user?.name || user?.email || "Unknown User",
              projectUrl,
            },
            recipients
          );
        }
      } catch (emailError) {
        console.error(
          "Failed to send milestone completion notifications:",
          emailError
        );
        // Don't fail milestone update if email fails
      }
    }

    revalidatePath(`/projects/${milestone.projectId}`);
    return { success: true, milestone };
  } catch (error) {
    console.error("Error updating milestone:", error);
    return { error: "Failed to update milestone" };
  }
}

export async function deleteMilestone(milestoneId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const milestone = await db.milestone.delete({
      where: { id: milestoneId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: milestone.projectId,
        action: "MILESTONE_DELETED",
        details: `Milestone "${milestone.title}" deleted`,
      },
    });

    revalidatePath(`/projects/${milestone.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return { error: "Failed to delete milestone" };
  }
}
