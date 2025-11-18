import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { stage, reviewerId, score, comments, decision } = body;

    // Validate required fields
    if (!stage || !reviewerId) {
      return NextResponse.json(
        { error: "Stage and reviewer are required" },
        { status: 400 }
      );
    }

    // Check if project exists and user has permission
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    const hasPermission =
      user?.role === "ADMIN" ||
      user?.role === "GATEKEEPER" ||
      project.leadId === session.user.id ||
      project.members.some((member: any) => member.userId === session.user.id);

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create the review
    const review = await db.gateReview.create({
      data: {
        projectId,
        stage,
        reviewerId,
        score: score || null,
        comments: comments || null,
        decision: decision || null,
        isCompleted: !!decision,
        reviewDate: decision ? new Date() : null,
      },
      include: {
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
            projectId: true,
          },
        },
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

    // Create notification for reviewer
    await db.notification.create({
      data: {
        userId: reviewerId,
        type: "GATE_REVIEW",
        title: "New Gate Review Assigned",
        message: `You have been assigned to review ${project.name} at ${stage}`,
        data: {
          projectId,
          reviewId: review.id,
          stage,
        },
      },
    });

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Get all reviews for the project
    const reviews = await db.gateReview.findMany({
      where: { projectId },
      include: {
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
