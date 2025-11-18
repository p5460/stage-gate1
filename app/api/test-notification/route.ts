import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to test notifications
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await request.json();
    const testEmail = email || session.user.email;

    if (!testEmail) {
      return NextResponse.json(
        { error: "No email address provided" },
        { status: 400 }
      );
    }

    // Send test notification
    const result = await sendEmail({
      to: testEmail,
      subject: "Test Notification - CSIR Stage-Gate Platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1976d2; margin: 0;">Test Notification</h2>
          </div>
          
          <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
            <p>Hello ${session.user.name || "User"},</p>
            
            <p>This is a test notification from the CSIR Stage-Gate Platform.</p>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h4 style="margin: 0 0 10px 0; color: #155724;">✓ Email System Working</h4>
              <p style="margin: 0; color: #155724;">Your notification system is configured correctly and working properly.</p>
            </div>
            
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Sent to: ${testEmail}</li>
              <li>Sent by: ${session.user.name || "Unknown"} (${session.user.email})</li>
              <li>Time: ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>This is a test notification from the CSIR Stage-Gate Platform.</p>
          </div>
        </div>
      `,
      text: `
Test Notification - CSIR Stage-Gate Platform

Hello ${session.user.name || "User"},

This is a test notification from the CSIR Stage-Gate Platform.

✓ Email System Working
Your notification system is configured correctly and working properly.

Test Details:
- Sent to: ${testEmail}
- Sent by: ${session.user.name || "Unknown"} (${session.user.email})
- Time: ${new Date().toLocaleString()}
      `,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test notification sent successfully",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send test notification" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
