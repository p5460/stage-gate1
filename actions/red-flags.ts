"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  sendRedFlagNotification,
  sendProjectNotification,
} from "@/lib/notifications";

export async function createRedFlag(
  projectId: string,
  title: string,
  description: string,
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const redFlag = await db.redFlag.create({
      data: {
        projectId,
        raisedById: session.user.id!,
        title,
        description,
        severity,
        status: "OPEN",
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
        raisedBy: true,
      },
    });

    // Update project status to RED_FLAG if severity is HIGH or CRITICAL
    if (severity === "HIGH" || severity === "CRITICAL") {
      await db.project.update({
        where: { id: projectId },
        data: { status: "RED_FLAG" },
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId,
        action: "RED_FLAG_RAISED",
        details: `Red flag raised: ${title} (${severity})`,
      },
    });

    // Send notifications to project team
    // Send email notifications for red flag
    try {
      await sendRedFlagNotification(
        projectId,
        title,
        description,
        redFlag.raisedBy.name || redFlag.raisedBy.email || "Unknown User"
      );
    } catch (emailError) {
      console.error("Failed to send red flag notifications:", emailError);
      // Don't fail red flag creation if email fails
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, redFlag };
  } catch (error) {
    console.error("Error creating red flag:", error);
    return { error: "Failed to create red flag" };
  }
}

export async function updateRedFlag(
  redFlagId: string,
  data: {
    title?: string;
    description?: string;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    resolvedBy?: string;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const updateData: any = { ...data };

    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = session.user.id;
    }

    const redFlag = await db.redFlag.update({
      where: { id: redFlagId },
      data: updateData,
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
        raisedBy: true,
      },
    });

    // If red flag is resolved/closed, check if project status should be updated
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      const openRedFlags = await db.redFlag.count({
        where: {
          projectId: redFlag.projectId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
          severity: { in: ["HIGH", "CRITICAL"] },
        },
      });

      // If no more high/critical red flags, update project status back to ACTIVE
      if (openRedFlags === 0) {
        await db.project.update({
          where: { id: redFlag.projectId },
          data: { status: "ACTIVE" },
        });
      }
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: redFlag.projectId,
        action: "RED_FLAG_UPDATED",
        details: `Red flag updated: ${redFlag.title} - Status: ${data.status || "Updated"}`,
      },
    });

    // Send notification if status changed to resolved/closed
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      const recipients = [
        redFlag.project.lead,
        ...redFlag.project.members.map((m: any) => m.user),
        redFlag.raisedBy,
      ];

      for (const recipient of recipients) {
        if (recipient.email && recipient.id !== session.user.id) {
          await sendProjectNotification(
            recipient.email,
            recipient.name || "Team Member",
            redFlag.project.name,
            redFlag.project.projectId,
            "Red Flag Resolved",
            `Red flag "${redFlag.title}" has been ${data.status?.toLowerCase()}`,
            `${process.env.NEXT_PUBLIC_APP_URL}/projects/${redFlag.projectId}`
          );
        }
      }
    }

    revalidatePath(`/projects/${redFlag.projectId}`);
    return { success: true, redFlag };
  } catch (error) {
    console.error("Error updating red flag:", error);
    return { error: "Failed to update red flag" };
  }
}

export async function deleteRedFlag(redFlagId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Check if user can delete (admin or the person who raised it)
    const redFlag = await db.redFlag.findUnique({
      where: { id: redFlagId },
      select: {
        raisedById: true,
        projectId: true,
        title: true,
      },
    });

    if (!redFlag) {
      return { error: "Red flag not found" };
    }

    const canDelete =
      session.user.role === "ADMIN" || redFlag.raisedById === session.user.id;

    if (!canDelete) {
      return { error: "Unauthorized to delete this red flag" };
    }

    await db.redFlag.delete({
      where: { id: redFlagId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: redFlag.projectId,
        action: "RED_FLAG_DELETED",
        details: `Red flag deleted: ${redFlag.title}`,
      },
    });

    revalidatePath(`/projects/${redFlag.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting red flag:", error);
    return { error: "Failed to delete red flag" };
  }
}

export async function getRedFlags(projectId?: string) {
  try {
    const redFlags = await db.redFlag.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        raisedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, redFlags };
  } catch (error) {
    console.error("Error fetching red flags:", error);
    return { error: "Failed to fetch red flags", redFlags: [] };
  }
}
export async function exportRedFlags(
  projectId?: string,
  format: "json" | "csv" = "json"
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const redFlags = await db.redFlag.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        raisedBy: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            name: true,
            projectId: true,
          },
        },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify(redFlags, null, 2),
        filename: projectId
          ? `project-${projectId}-red-flags.json`
          : "all-red-flags.json",
        mimeType: "application/json",
      };
    } else {
      // CSV format
      const csvRows = [];
      csvRows.push(
        "ID,Title,Description,Severity,Status,Project,Project ID,Raised By,Email,Role,Created At,Resolved At"
      );

      redFlags.forEach((redFlag: any) => {
        csvRows.push(
          [
            redFlag.id,
            `"${redFlag.title.replace(/"/g, '""')}"`,
            `"${redFlag.description.replace(/"/g, '""')}"`,
            redFlag.severity,
            redFlag.status,
            redFlag.project?.name || "N/A",
            redFlag.project?.projectId || "N/A",
            redFlag.raisedBy.name || "Unknown",
            redFlag.raisedBy.email || "",
            redFlag.raisedBy.role,
            redFlag.createdAt.toISOString(),
            redFlag.resolvedAt?.toISOString() || "",
          ].join(",")
        );
      });

      return {
        success: true,
        data: csvRows.join("\n"),
        filename: projectId
          ? `project-${projectId}-red-flags.csv`
          : "all-red-flags.csv",
        mimeType: "text/csv",
      };
    }
  } catch (error) {
    console.error("Error exporting red flags:", error);
    return { error: "Failed to export red flags" };
  }
}
