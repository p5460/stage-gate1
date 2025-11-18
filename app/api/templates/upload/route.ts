import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const stage = formData.get("stage") as string;
    const isRequired = formData.get("isRequired") === "true";

    if (!file || !name || !category || !stage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check user permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasPermission =
      user.role === "ADMIN" ||
      user.role === "GATEKEEPER" ||
      user.role === "PROJECT_LEAD";

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate file
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      return NextResponse.json(
        { error: "File size too large" },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "uploads", "templates");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split(".").pop();
    const fileName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(uploadDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const template = await db.documentTemplate.create({
      data: {
        name,
        description: description || null,
        category,
        stage,
        fileName,
        originalName,
        filePath: `/uploads/templates/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        isRequired,
        uploadedById: session.user.id!,
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "TEMPLATE_UPLOADED",
        details: `Template "${name}" uploaded`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Template uploaded successfully",
      template,
    });
  } catch (error) {
    console.error("Error uploading template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const stage = searchParams.get("stage");

    const whereClause: any = {};
    if (category) whereClause.category = category;
    if (stage && stage !== "ALL") whereClause.stage = stage;

    const templates = await db.documentTemplate.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
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
      templates,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
