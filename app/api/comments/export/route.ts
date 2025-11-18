import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportComments } from "@/actions/comments";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const format = (searchParams.get("format") as "json" | "csv") || "json";

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    const result = await exportComments(projectId, format);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const headers = new Headers();
    headers.set("Content-Type", result.mimeType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    return new NextResponse(result.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, format } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const result = await exportComments(projectId, format || "json");

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      filename: result.filename,
      mimeType: result.mimeType,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
