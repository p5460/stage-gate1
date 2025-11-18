import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canManageUsers, UserRole } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !canManageUsers(user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customRoles = await db.customRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, customRoles });
  } catch (error) {
    console.error("Error fetching custom roles:", error);
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

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !canManageUsers(user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color, permissionIds } = body;

    if (!name || !Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await db.customRole.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role name already exists" },
        { status: 400 }
      );
    }

    // Create the custom role
    const customRole = await db.customRole.create({
      data: {
        name,
        description,
        color: color || "#6B7280",
        isActive: true,
      },
    });

    // Add permissions to the role
    if (permissionIds.length > 0) {
      await db.customRolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          customRoleId: customRole.id,
          permissionId,
        })),
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "CUSTOM_ROLE_CREATED",
        details: `Custom role "${name}" created with ${permissionIds.length} permissions`,
      },
    });

    return NextResponse.json({ success: true, customRole });
  } catch (error) {
    console.error("Error creating custom role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
