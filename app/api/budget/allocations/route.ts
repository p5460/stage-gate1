import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createBudgetAllocation,
  getPendingBudgetApprovals,
} from "@/actions/budget";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await createBudgetAllocation(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Budget allocation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user to check role
    const user = await (db as any).user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If admin/gatekeeper, get pending approvals
    if (user.role === "ADMIN" || user.role === "GATEKEEPER") {
      const result = await getPendingBudgetApprovals();
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // If project lead, get their own allocations
    if (user.role === "PROJECT_LEAD") {
      const allocations = await (db as any).budgetAllocation.findMany({
        where: {
          requestedBy: session.user.id,
        },
        include: {
          project: { select: { id: true, name: true, projectId: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ allocations });
    }

    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Budget approvals API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
