import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportRedFlags } from "@/actions/red-flags";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const format = (searchParams.get("format") as "json" | "csv") || "json";

  try {
    const result = await exportRedFlags(projectId || undefined, format);

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

    const result = await exportRedFlags(projectId, format || "json");

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
