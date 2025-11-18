import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      stage,
      reviewerId,
      criteria,
      comments,
      recommendation,
      totalScore,
      weightedScore,
      reviewDate,
      isCompleted,
    } = body;

    // Validate required fields
    if (!projectId || !stage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use provided reviewerId or default to current user
    const actualReviewerId = reviewerId || session.user.id;

    // Check if user has permission to review this project
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { lead: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if review already exists
    const existingReview = await db.gateReview.findFirst({
      where: {
        projectId,
        stage,
        reviewerId: actualReviewerId,
      },
    });

    // Create or update the gate review
    const gateReview = existingReview
      ? await db.gateReview.update({
          where: { id: existingReview.id },
          data: {
            decision: recommendation,
            score: totalScore,
            comments,
            reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
            isCompleted: isCompleted || false,
            updatedAt: new Date(),
          },
          include: {
            project: {
              include: {
                lead: true,
                cluster: true,
              },
            },
            reviewer: true,
          },
        })
      : await db.gateReview.create({
          data: {
            projectId,
            stage,
            reviewerId: actualReviewerId,
            decision: recommendation,
            score: totalScore,
            comments,
            reviewDate: reviewDate ? new Date(reviewDate) : new Date(),
            isCompleted: isCompleted || false,
          },
          include: {
            project: {
              include: {
                lead: true,
                cluster: true,
              },
            },
            reviewer: true,
          },
        });

    // Store detailed evaluation criteria in activity log if provided
    if (criteria) {
      const detailedEvaluation = {
        criteria,
        totalScore,
        weightedScore,
        evaluationDate: reviewDate,
      };

      await db.activityLog.create({
        data: {
          userId: session.user.id,
          projectId,
          action: isCompleted ? "REVIEW_COMPLETED" : "REVIEW_DRAFT_SAVED",
          details: `Review ${isCompleted ? "completed" : "draft saved"} for ${stage}${recommendation ? ` with decision: ${recommendation}` : ""}`,
          metadata: detailedEvaluation,
        },
      });
    }

    // Create notification for project lead if review is completed
    if (isCompleted && recommendation) {
      await db.notification.create({
        data: {
          userId: project.leadId,
          type: "GATE_REVIEW",
          title: "Review Completed",
          message: `A review for "${project.name}" has been completed with decision: ${recommendation}`,
          data: {
            projectId,
            reviewId: gateReview.id,
            decision: recommendation,
            score: totalScore,
          },
        },
      });

      // Check if this was a GO decision and update project status
      if (recommendation === "GO") {
        // Get all completed reviews for this stage
        const allStageReviews = await db.gateReview.findMany({
          where: {
            projectId,
            stage,
            isCompleted: true,
          },
        });

        // If all reviews are GO, advance the project
        const allGo = allStageReviews.every(
          (review: any) => review.decision === "GO"
        );

        if (allGo && allStageReviews.length > 0) {
          const nextStage = getNextStage(stage);
          await db.project.update({
            where: { id: projectId },
            data: {
              currentStage: nextStage as any,
              status: "ACTIVE",
            },
          });

          // Notify project lead of advancement
          await db.notification.create({
            data: {
              userId: project.leadId,
              type: "GATE_REVIEW",
              title: "Project Advanced",
              message: `"${project.name}" has been advanced to ${formatStage(nextStage)}`,
              data: {
                projectId,
                newStage: nextStage,
                previousStage: stage,
              },
            },
          });
        }
      } else if (recommendation === "STOP") {
        await db.project.update({
          where: { id: projectId },
          data: { status: "TERMINATED" },
        });
      } else if (recommendation === "HOLD") {
        await db.project.update({
          where: { id: projectId },
          data: { status: "ON_HOLD" },
        });
      }
    }

    return NextResponse.json({
      success: true,
      review: gateReview,
      message: isCompleted
        ? "Review submitted successfully"
        : "Review saved as draft",
    });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getNextStage(currentStage: string): string {
  switch (currentStage) {
    case "STAGE_0":
      return "STAGE_1";
    case "STAGE_1":
      return "STAGE_2";
    case "STAGE_2":
      return "STAGE_3";
    case "STAGE_3":
      return "STAGE_3"; // Final stage
    default:
      return currentStage;
  }
}

function formatStage(stage: string): string {
  switch (stage) {
    case "STAGE_0":
      return "Stage 0: Concept";
    case "STAGE_1":
      return "Stage 1: Research Planning";
    case "STAGE_2":
      return "Stage 2: Feasibility";
    case "STAGE_3":
      return "Stage 3: Maturation";
    default:
      return stage;
  }
}
