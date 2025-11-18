import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the user in the database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // If user doesn't have a role, assign one based on email
    if (!user.role) {
      let role = "USER"; // default role

      // Assign roles based on email patterns
      if (user.email === "admin@csir.co.za") {
        role = "ADMIN";
      } else if (user.email === "gatekeeper@csir.co.za") {
        role = "GATEKEEPER";
      } else if (
        user.email?.includes("lead") ||
        user.email?.includes("manager")
      ) {
        role = "PROJECT_LEAD";
      } else if (user.email?.includes("researcher")) {
        role = "RESEARCHER";
      } else if (user.email?.includes("reviewer")) {
        role = "REVIEWER";
      }

      // Update the user's role
      await db.user.update({
        where: { id: user.id },
        data: { role: role as any },
      });

      return NextResponse.json({
        success: true,
        message: `Role updated to ${role}`,
        role,
      });
    }

    return NextResponse.json({
      success: true,
      message: "User already has a role",
      role: user.role,
    });
  } catch (error) {
    console.error("Error fixing user role:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
