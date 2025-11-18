import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { notificationId } = await params;

    // Verify the notification belongs to the user
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id!,
      },
    });

    if (!notification) {
      return new NextResponse("Notification not found", { status: 404 });
    }

    // Mark as read
    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
