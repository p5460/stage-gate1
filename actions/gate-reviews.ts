"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendProjectNotification } from "@/lib/mail";

export async function createGateReview(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const projectId = formData.get("projectId") as string;
  const stage = formData.get("stage") as string;
  const reviewerId = formData.get("reviewerId") as string;

  try {
    const gateReview = await db.gateReview.create({
      data: {
        projectId,
        stage: stage as any,
        reviewerId: reviewerId || session.user.id!,
      },
      include: {
        project: {
          include: {
            lead: true,
          },
        },
        reviewer: true,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId,
        action: "GATE_REVIEW_CREATED",
        details: `Gate review created for ${stage}`,
      },
    });

    // Send notification to project lead
    if (gateReview.project.lead.email) {
      await sendProjectNotification(
        gateReview.project.lead.email,
        gateReview.project.lead.name || "Project Lead",
        gateReview.project.name,
        gateReview.project.projectId,
        "Gate Review Created",
        `A new gate review has been created for ${stage}`,
        `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}`
      );
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, reviewId: gateReview.id };
  } catch (error) {
    console.error("Error creating gate review:", error);
    return { error: "Failed to create gate review" };
  }
}

export async function submitGateReview(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const reviewId = formData.get("reviewId") as string;
  const decision = formData.get("decision") as string;
  const score = parseFloat(formData.get("score") as string) || null;
  const comments = formData.get("comments") as string;

  try {
    const gateReview = await db.gateReview.update({
      where: { id: reviewId },
      data: {
        decision: decision as any,
        score,
        comments,
        reviewDate: new Date(),
        isCompleted: true,
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

    // Update project stage if decision is GO
    if (decision === "GO") {
      const nextStage = getNextStage(gateReview.stage);
      if (nextStage) {
        await db.project.update({
          where: { id: gateReview.projectId },
          data: {
            currentStage: nextStage,
            status: "ACTIVE",
          },
        });
      }
    } else if (decision === "HOLD") {
      await db.project.update({
        where: { id: gateReview.projectId },
        data: { status: "ON_HOLD" },
      });
    } else if (decision === "STOP") {
      await db.project.update({
        where: { id: gateReview.projectId },
        data: { status: "TERMINATED" },
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: gateReview.projectId,
        action: "GATE_REVIEW_COMPLETED",
        details: `Gate review completed with decision: ${decision}`,
      },
    });

    // Send notifications to project team
    const recipients = [
      gateReview.project.lead,
      ...gateReview.project.members.map((m: any) => m.user),
    ];

    for (const recipient of recipients) {
      if (recipient.email) {
        await sendProjectNotification(
          recipient.email,
          recipient.name || "Team Member",
          gateReview.project.name,
          gateReview.project.projectId,
          "Gate Review Completed",
          `Gate review completed with decision: ${decision}. ${comments ? `Comments: ${comments}` : ""}`,
          `${process.env.NEXT_PUBLIC_APP_URL}/projects/${gateReview.projectId}`
        );
      }
    }

    revalidatePath(`/projects/${gateReview.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error submitting gate review:", error);
    return { error: "Failed to submit gate review" };
  }
}

function getNextStage(currentStage: string): any {
  const stageOrder = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3"];
  const currentIndex = stageOrder.indexOf(currentStage);

  if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
    return stageOrder[currentIndex + 1] as any;
  }

  return null;
}

export async function assignGateReviewer(reviewId: string, reviewerId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const gateReview = await db.gateReview.update({
      where: { id: reviewId },
      data: { reviewerId },
      include: {
        project: true,
        reviewer: true,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: gateReview.projectId,
        action: "REVIEWER_ASSIGNED",
        details: `Reviewer assigned to gate review`,
      },
    });

    // Send notification to assigned reviewer
    if (gateReview.reviewer.email) {
      await sendProjectNotification(
        gateReview.reviewer.email,
        gateReview.reviewer.name || "Reviewer",
        gateReview.project.name,
        gateReview.project.projectId,
        "Gate Review Assignment",
        `You have been assigned to review ${gateReview.stage} for this project`,
        `${process.env.NEXT_PUBLIC_APP_URL}/projects/${gateReview.projectId}`
      );
    }

    revalidatePath(`/projects/${gateReview.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error assigning reviewer:", error);
    return { error: "Failed to assign reviewer" };
  }
}

export async function updateGateReview(
  reviewId: string,
  data: {
    decision?: string;
    score?: number;
    comments?: string;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const gateReview = await db.gateReview.update({
      where: { id: reviewId },
      data: {
        ...data,
        decision: data.decision as any,
        reviewDate: new Date(),
        isCompleted: true,
      },
    });

    // If decision is GO, advance project stage
    if (data.decision === "GO") {
      const nextStage = getNextStage(gateReview.stage);
      if (nextStage) {
        await db.project.update({
          where: { id: gateReview.projectId },
          data: { currentStage: nextStage },
        });
      }
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: gateReview.projectId,
        action: "GATE_REVIEWED",
        details: `Gate review completed with ${data.decision} decision`,
      },
    });

    revalidatePath(`/projects/${gateReview.projectId}`);
    return { success: true, gateReview };
  } catch (error) {
    console.error("Error updating gate review:", error);
    return { error: "Failed to update gate review" };
  }
}

export async function deleteGateReview(reviewId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const gateReview = await db.gateReview.delete({
      where: { id: reviewId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: gateReview.projectId,
        action: "GATE_REVIEW_DELETED",
        details: "Gate review deleted",
      },
    });

    revalidatePath(`/projects/${gateReview.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting gate review:", error);
    return { error: "Failed to delete gate review" };
  }
}
