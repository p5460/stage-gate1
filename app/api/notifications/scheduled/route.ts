import { NextRequest, NextResponse } from "next/server";
import {
  sendMilestoneReminders,
  sendWeeklyDigest,
} from "@/lib/scheduled-notifications";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (you might want to add authentication)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "your-secret-token";

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "milestone-reminders":
        await sendMilestoneReminders();
        return NextResponse.json({
          success: true,
          message: "Milestone reminders sent",
        });

      case "weekly-digest":
        await sendWeeklyDigest();
        return NextResponse.json({
          success: true,
          message: "Weekly digest sent",
        });

      default:
        return NextResponse.json(
          { error: "Invalid notification type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in scheduled notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
