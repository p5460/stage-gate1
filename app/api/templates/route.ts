import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const stage = searchParams.get("stage");

    const where: any = { isActive: true };

    if (type) {
      where.type = type;
    }

    if (stage) {
      where.OR = [{ stage: stage }, { stage: null }];
    }

    const templates = await db.template.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, type, stage, fileUrl, fileName } = body;

    if (!name || !type || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const template = await db.template.create({
      data: {
        name,
        description,
        type,
        stage: stage || null,
        fileUrl,
        fileName,
        isActive: true,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "TEMPLATE_CREATED",
        details: `Template "${name}" created`,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
