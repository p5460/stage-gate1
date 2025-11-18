import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { submitExpense } from "@/actions/budget";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's expenses
    const expenses = await (db as any).budgetExpense.findMany({
      where: {
        submittedBy: session.user.id,
      },
      include: {
        budgetAllocation: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Get expenses API error:", error);
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

    const body = await request.json();

    // Convert expenseDate string to Date object
    if (body.expenseDate) {
      body.expenseDate = new Date(body.expenseDate);
    }

    const result = await submitExpense(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Expense submission API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
