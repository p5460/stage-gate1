import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        query: query?.trim() || "",
        totalResults: 0,
        results: {
          projects: [],
          users: [],
          documents: [],
          redFlags: [],
          comments: [],
        },
      });
    }

    const searchTerm = query.trim().toLowerCase();

    const results: any = {};

    // Search projects
    if (type === "all" || type === "projects") {
      try {
        results.projects = await db.project.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { projectId: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
              { businessCase: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            projectId: true,
            description: true,
            status: true,
            updatedAt: true,
            lead: {
              select: { name: true },
            },
            cluster: {
              select: { name: true },
            },
          },
          take: limit,
          orderBy: { updatedAt: "desc" },
        });
      } catch (error) {
        console.error("Error searching projects:", error);
        results.projects = [];
      }
    }

    // Search users (admin/gatekeeper only)
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (
      (type === "all" || type === "users") &&
      user &&
      ["ADMIN", "GATEKEEPER"].includes(user.role)
    ) {
      try {
        results.users = await db.user.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
              { department: { contains: searchTerm, mode: "insensitive" } },
              { position: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true,
          },
          take: limit,
          orderBy: { name: "asc" },
        });
      } catch (error) {
        console.error("Error searching users:", error);
        results.users = [];
      }
    }

    // Search documents
    if (type === "all" || type === "documents") {
      try {
        results.documents = await db.document.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
              { fileName: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            fileName: true,
            description: true,
            type: true,
            createdAt: true,
            project: {
              select: { id: true, name: true, projectId: true },
            },
            uploader: {
              select: { name: true },
            },
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("Error searching documents:", error);
        results.documents = [];
      }
    }

    // Search red flags
    if (type === "all" || type === "red-flags") {
      try {
        results.redFlags = await db.redFlag.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            title: true,
            description: true,
            severity: true,
            status: true,
            createdAt: true,
            project: {
              select: { id: true, name: true, projectId: true },
            },
            raisedBy: {
              select: { name: true },
            },
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("Error searching red flags:", error);
        results.redFlags = [];
      }
    }

    // Search comments
    if (type === "all" || type === "comments") {
      try {
        results.comments = await db.comment.findMany({
          where: {
            content: { contains: searchTerm, mode: "insensitive" },
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: { name: true },
            },
            project: {
              select: { id: true, name: true, projectId: true },
            },
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("Error searching comments:", error);
        results.comments = [];
      }
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce(
      (sum: number, items: any) =>
        sum + (Array.isArray(items) ? items.length : 0),
      0
    );

    return NextResponse.json({
      success: true,
      query,
      totalResults,
      results,
    });
  } catch (error) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
