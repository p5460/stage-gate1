import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Get specific review session (simplified)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the session ID (format: projectId-stage)
    const [projectId, stage] = id.split("-");

    if (!projectId || !stage) {
      return NextResponse.json(
        { error: "Invalid session ID format" },
        { status: 400 }
      );
    }

    // Get project first
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        lead: true,
        cluster: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all reviews for this project and stage
    const gateReviews = await db.gateReview.findMany({
      where: {
        projectId,
        stage: stage as any,
      },
      include: {
        reviewer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (gateReviews.length === 0) {
      return NextResponse.json(
        { error: "Review session not found" },
        { status: 404 }
      );
    }

    // Construct session object from reviews
    const completedReviews = gateReviews.filter((r: any) => r.isCompleted);

    const reviewSession = {
      id: id,
      projectId,
      stage,
      status:
        completedReviews.length === gateReviews.length
          ? "COMPLETED"
          : "IN_PROGRESS",
      requiredReviewers: gateReviews.length,
      completedReviews: completedReviews.length,
      averageScore:
        completedReviews.length > 0
          ? completedReviews.reduce(
              (sum: any, r: any) => sum + (r.score || 0),
              0
            ) / completedReviews.length
          : null,
      finalDecision: null,
      project,
      gateReviews,
      reviewAssignments: gateReviews.map((review: any) => ({
        id: review.id,
        sessionId: id,
        reviewerId: review.reviewerId,
        status: review.isCompleted ? "COMPLETED" : "ASSIGNED",
        assignedAt: review.createdAt,
        reviewer: review.reviewer,
      })),
    };

    return NextResponse.json({ success: true, session: reviewSession });
  } catch (error) {
    console.error("Error fetching review session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update review session (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, finalDecision } = body;

    // Parse the session ID (format: projectId-stage)
    const [projectId, stage] = id.split("-");

    if (!projectId || !stage) {
      return NextResponse.json(
        { error: "Invalid session ID format" },
        { status: 400 }
      );
    }

    // Get project
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all completed reviews for this session
    const gateReviews = await db.gateReview.findMany({
      where: {
        projectId,
        stage: stage as any,
        isCompleted: true,
      },
    });

    if (gateReviews.length === 0) {
      return NextResponse.json(
        { error: "No completed reviews found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // Calculate average score and determine final decision
      const averageScore =
        gateReviews.reduce(
          (sum: any, review: any) => sum + (review.score || 0),
          0
        ) / gateReviews.length;

      // Determine final decision based on individual decisions
      const decisions = gateReviews.map((r: any) => r.decision);
      const goCount = decisions.filter((d: any) => d === "GO").length;
      const stopCount = decisions.filter((d: any) => d === "STOP").length;

      let calculatedDecision = finalDecision;
      if (!calculatedDecision) {
        if (stopCount > 0) calculatedDecision = "STOP";
        else if (goCount >= Math.ceil(gateReviews.length / 2))
          calculatedDecision = "GO";
        else calculatedDecision = "RECYCLE";
      }

      // Update project status and stage if decision is GO
      if (calculatedDecision === "GO") {
        const nextStage = getNextStage(stage);
        await db.project.update({
          where: { id: projectId },
          data: {
            currentStage: nextStage as any,
            status: "ACTIVE",
          },
        });
      } else if (calculatedDecision === "STOP") {
        await db.project.update({
          where: { id: projectId },
          data: {
            status: "TERMINATED",
          },
        });
      } else if (calculatedDecision === "HOLD") {
        await db.project.update({
          where: { id: projectId },
          data: {
            status: "ON_HOLD",
          },
        });
      }

      // Create activity log
      await db.activityLog.create({
        data: {
          userId: session.user.id,
          projectId,
          action: "REVIEW_SESSION_APPROVED",
          details: `Review session approved with decision: ${calculatedDecision}`,
          metadata: {
            sessionId: id,
            averageScore,
            finalDecision: calculatedDecision,
            completedReviews: gateReviews.length,
          },
        },
      });

      // Notify project lead
      await db.notification.create({
        data: {
          userId: project.leadId,
          type: "GATE_REVIEW",
          title: "Review Session Completed",
          message: `Review session for "${project.name}" has been completed with decision: ${calculatedDecision}`,
          data: {
            projectId,
            sessionId: id,
            decision: calculatedDecision,
            averageScore,
          },
        },
      });

      return NextResponse.json({
        success: true,
        decision: calculatedDecision,
        averageScore,
        message: "Review session approved and project updated",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Invalid action or insufficient completed reviews",
    });
  } catch (error) {
    console.error("Error updating review session:", error);
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
