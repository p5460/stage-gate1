import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        cluster: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        documents: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        gateReviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        redFlags: {
          include: {
            raisedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();

    const project = await db.project.update({
      where: { id: projectId },
      data: body,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        cluster: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: project.id,
        action: "PROJECT_UPDATED",
        details: `Project ${project.name} was updated`,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_PATCH]", error);

    // Check if it's a Prisma error
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { error: "Invalid cluster or lead ID provided" },
          { status: 400 }
        );
      }
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Project with this name already exists" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();

    const project = await db.project.update({
      where: { id: projectId },
      data: body,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        cluster: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: project.id,
        action: "PROJECT_UPDATED",
        details: `Project ${project.name} was updated`,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_PUT]", error);

    // Check if it's a Prisma error
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { error: "Invalid cluster or lead ID provided" },
          { status: 400 }
        );
      }
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Project with this name already exists" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;

    // Get project details before deletion for logging
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { name: true, leadId: true },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Check if user has permission to delete (project lead or admin)
    if (project.leadId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete project (cascade will handle related records)
    await db.project.delete({
      where: { id: projectId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: null, // Project is deleted, so no projectId
        action: "PROJECT_DELETED",
        details: `Project ${project.name} was deleted`,
      },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
