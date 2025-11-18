import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return new NextResponse("Project ID is required", { status: 400 });
    }

    // Get the original project
    const originalProject = await db.project.findUnique({
      where: { id: projectId },
      include: {
        documents: true,
        members: true,
      },
    });

    if (!originalProject) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Generate new project ID
    const projectCount = await db.project.count();
    const newProjectId = `STP-${String(projectCount + 1).padStart(4, "0")}`;

    // Create duplicated project
    const duplicatedProject = await db.project.create({
      data: {
        projectId: newProjectId,
        name: `${originalProject.name} (Copy)`,
        description: originalProject.description,
        businessCase: originalProject.businessCase,
        clusterId: originalProject.clusterId,
        leadId: session.user.id!, // Set current user as lead
        budget: originalProject.budget,
        duration: originalProject.duration,
        currentStage: "STAGE_0", // Reset to initial stage
        status: "ACTIVE",
        startDate: new Date(),
      },
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

    // Duplicate project members (optional - you might want to skip this)
    if (originalProject.members.length > 0) {
      await db.projectMember.createMany({
        data: originalProject.members.map((member: any) => ({
          projectId: duplicatedProject.id,
          userId: member.userId,
          role: member.role,
        })),
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: duplicatedProject.id,
        action: "PROJECT_CREATED",
        details: `Project ${duplicatedProject.name} was created as a duplicate of ${originalProject.name}`,
      },
    });

    return NextResponse.json(duplicatedProject);
  } catch (error) {
    console.error("[PROJECT_DUPLICATE]", error);
    return NextResponse.json(
      { error: "Failed to duplicate project" },
      { status: 500 }
    );
  }
}
