import { NextRequest, NextResponse } from "next/server";
import { exportGateReviews, getGateReviewsForExport } from "@/actions/reviews";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const format =
      (searchParams.get("format") as "json" | "csv" | "excel") || "csv";
    const projectId = searchParams.get("projectId") || undefined;
    const stage = searchParams.get("stage") || undefined;
    const reviewerId = searchParams.get("reviewerId") || undefined;
    const decision = searchParams.get("decision") || undefined;
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;
    const isCompleted = searchParams.get("isCompleted")
      ? searchParams.get("isCompleted") === "true"
      : undefined;
    const preview = searchParams.get("preview") === "true";

    // Build filters object
    const filters = {
      projectId,
      stage,
      reviewerId,
      decision,
      dateFrom,
      dateTo,
      isCompleted,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    // If preview is requested, return summary data
    if (preview) {
      const result = await getGateReviewsForExport(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    // Export the data
    const result = await exportGateReviews(
      Object.keys(filters).length > 0 ? filters : undefined,
      format
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return the file for download
    const headers = new Headers();
    headers.set("Content-Type", result.mimeType || "text/plain");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${result.filename || "export.txt"}"`
    );
    headers.set("X-Export-Count", (result.count || 0).toString());

    return new NextResponse(result.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Gate reviews export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = "csv", filters = {} } = body;

    // Export the data with POST body filters
    const result = await exportGateReviews(filters, format);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filename: result.filename,
      mimeType: result.mimeType,
      count: result.count,
      data: result.data,
    });
  } catch (error) {
    console.error("Gate reviews export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
