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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    const type = searchParams.get("type") || "all";

    let data: any = {};

    // Export different types of data based on request
    switch (type) {
      case "projects":
        data = await db.project.findMany({
          include: {
            lead: {
              select: { name: true, email: true },
            },
            cluster: {
              select: { name: true },
            },
            members: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
            gateReviews: {
              include: {
                reviewer: {
                  select: { name: true, email: true },
                },
              },
            },
            documents: {
              select: {
                name: true,
                type: true,
                isApproved: true,
                createdAt: true,
              },
            },
            redFlags: {
              select: {
                title: true,
                severity: true,
                status: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                documents: true,
                redFlags: true,
                members: true,
                comments: true,
              },
            },
          },
        });
        break;

      case "users":
        data = await db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            customRole: {
              select: {
                name: true,
                description: true,
              },
            },
            department: true,
            position: true,
            emailVerified: true,
            createdAt: true,
            _count: {
              select: {
                projectsLed: true,
                projectMembers: true,
                gateReviews: true,
                documents: true,
                redFlags: true,
                comments: true,
              },
            },
          },
        });
        break;

      case "gate-reviews":
        data = await db.gateReview.findMany({
          include: {
            project: {
              select: {
                name: true,
                projectId: true,
                cluster: {
                  select: { name: true },
                },
              },
            },
            reviewer: {
              select: { name: true, email: true },
            },
          },
        });
        break;

      case "red-flags":
        data = await db.redFlag.findMany({
          include: {
            project: {
              select: {
                name: true,
                projectId: true,
                cluster: {
                  select: { name: true },
                },
              },
            },
            raisedBy: {
              select: { name: true, email: true },
            },
          },
        });
        break;

      case "analytics":
        const [
          projectStats,
          userStats,
          gateReviewStats,
          redFlagStats,
          documentStats,
        ] = await Promise.all([
          db.project.groupBy({
            by: ["status", "currentStage"],
            _count: true,
          }),
          db.user.groupBy({
            by: ["role"],
            _count: true,
          }),
          db.gateReview.groupBy({
            by: ["decision"],
            _count: true,
            where: { decision: { not: null } },
          }),
          db.redFlag.groupBy({
            by: ["status", "severity"],
            _count: true,
          }),
          db.document.groupBy({
            by: ["type"],
            _count: true,
          }),
        ]);

        data = {
          projectStats,
          userStats,
          gateReviewStats,
          redFlagStats,
          documentStats,
          exportedAt: new Date().toISOString(),
          exportedBy: user.name,
        };
        break;

      default: // "all"
        data = {
          projects: await db.project.findMany({
            include: {
              lead: { select: { name: true, email: true } },
              cluster: { select: { name: true } },
              _count: {
                select: {
                  documents: true,
                  redFlags: true,
                  members: true,
                },
              },
            },
          }),
          users: await db.user.findMany({
            select: {
              name: true,
              email: true,
              role: true,
              department: true,
              position: true,
              createdAt: true,
            },
          }),
          clusters: await db.cluster.findMany(),
          gateReviews: await db.gateReview.findMany({
            include: {
              project: { select: { name: true, projectId: true } },
              reviewer: { select: { name: true } },
            },
          }),
          redFlags: await db.redFlag.findMany({
            include: {
              project: { select: { name: true, projectId: true } },
              raisedBy: { select: { name: true } },
            },
          }),
          exportedAt: new Date().toISOString(),
          exportedBy: user.name,
        };
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "DATA_EXPORTED",
        details: `Exported ${type} data in ${format} format`,
      },
    });

    if (format === "csv") {
      // Convert to CSV format (simplified)
      let csvData = "";

      if (type === "projects" && Array.isArray(data)) {
        csvData = [
          "ID,Name,Project ID,Status,Stage,Budget,Lead,Cluster,Created",
          ...data.map(
            (p: any) =>
              `${p.id},${p.name},${p.projectId},${p.status},${p.currentStage},${p.budget || 0},${p.lead?.name || ""},${p.cluster?.name || ""},${p.createdAt}`
          ),
        ].join("\n");
      } else if (type === "users" && Array.isArray(data)) {
        csvData = [
          "ID,Name,Email,Role,Department,Position,Created",
          ...data.map(
            (u: any) =>
              `${u.id},${u.name || ""},${u.email || ""},${u.role},${u.department || ""},${u.position || ""},${u.createdAt}`
          ),
        ].join("\n");
      } else {
        // For complex data, convert to JSON string in CSV
        csvData = JSON.stringify(data, null, 2);
      }

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="stage-gate-${type}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.name,
        format,
        type,
        recordCount: Array.isArray(data)
          ? data.length
          : Object.keys(data).length,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
