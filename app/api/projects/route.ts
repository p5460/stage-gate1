import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projects = await db.project.findMany({
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
        _count: {
          select: {
            documents: true,
            redFlags: { where: { status: "OPEN" } },
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description, businessCase, clusterId, budget, duration } =
      body;

    if (!name || !clusterId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Generate project ID
    const projectCount = await db.project.count();
    const projectId = `STP-${String(projectCount + 1).padStart(4, "0")}`;

    const project = await db.project.create({
      data: {
        projectId,
        name,
        description,
        businessCase,
        clusterId,
        leadId: session.user.id!,
        budget: budget ? parseFloat(budget) : null,
        duration: duration ? parseInt(duration) : null,
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

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: project.id,
        action: "PROJECT_CREATED",
        details: `Project ${project.name} was created`,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
