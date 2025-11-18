import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - List review sessions (simplified for current schema)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // For now, return existing gate reviews grouped by project and stage
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    const gateReviews = await db.gateReview.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            lead: true,
            cluster: true,
          },
        },
        reviewer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group reviews by project and stage to simulate sessions
    const sessions = gateReviews.reduce((acc: any[], review: any) => {
      const sessionKey = `${review.projectId}-${review.stage}`;
      let session = acc.find((s) => s.id === sessionKey);

      if (!session) {
        session = {
          id: sessionKey,
          projectId: review.projectId,
          stage: review.stage,
          status: "IN_PROGRESS",
          requiredReviewers: 1,
          completedReviews: 0,
          averageScore: null,
          finalDecision: null,
          project: review.project,
          gateReviews: [],
          reviewAssignments: [],
        };
        acc.push(session);
      }

      session.gateReviews.push(review);
      if (review.isCompleted) {
        session.completedReviews++;
      }

      return acc;
    }, []);

    // Calculate session statistics
    sessions.forEach((session: any) => {
      const completedReviews = session.gateReviews.filter(
        (r: any) => r.isCompleted
      );
      session.completedReviews = completedReviews.length;
      session.requiredReviewers = session.gateReviews.length;

      if (completedReviews.length > 0) {
        session.averageScore =
          completedReviews.reduce(
            (sum: number, r: any) => sum + (r.score || 0),
            0
          ) / completedReviews.length;
        session.status =
          completedReviews.length === session.gateReviews.length
            ? "COMPLETED"
            : "IN_PROGRESS";
      }
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching review sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new review session (simplified)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, stage, reviewerIds, dueDate } = body;

    // Validate required fields
    if (!projectId || !stage || !reviewerIds || reviewerIds.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create individual gate reviews for each reviewer
    const reviews = await Promise.all(
      reviewerIds.map((reviewerId: string) =>
        db.gateReview.create({
          data: {
            projectId,
            stage,
            reviewerId,
            isCompleted: false,
            comments: `Review assigned for ${stage}`,
          },
          include: {
            reviewer: true,
            project: true,
          },
        })
      )
    );

    // Create notifications for assigned reviewers
    await Promise.all(
      reviews.map((review) =>
        db.notification.create({
          data: {
            userId: review.reviewerId,
            type: "GATE_REVIEW",
            title: "New Review Assignment",
            message: `You have been assigned to review "${project.name}" for ${stage}`,
            data: {
              projectId,
              reviewId: review.id,
              stage,
            },
          },
        })
      )
    );

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        projectId,
        action: "REVIEWERS_ASSIGNED",
        details: `Assigned ${reviewerIds.length} reviewers for ${stage}`,
        metadata: {
          reviewerIds,
          stage,
          dueDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      reviews,
      message: "Reviewers assigned successfully",
    });
  } catch (error) {
    console.error("Error creating review session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
