"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createComment(
  content: string,
  projectId?: string,
  parentId?: string
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const comment = await db.comment.create({
      data: {
        content,
        authorId: session.user.id!,
        projectId,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Create activity log if it's a project comment
    if (projectId) {
      await db.activityLog.create({
        data: {
          userId: session.user.id!,
          projectId,
          action: parentId ? "COMMENT_REPLY_CREATED" : "COMMENT_CREATED",
          details: `${parentId ? "Reply" : "Comment"} added: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
        },
      });

      revalidatePath(`/projects/${projectId}`);
    }

    return { success: true, comment };
  } catch (error) {
    console.error("Error creating comment:", error);
    return { error: "Failed to create comment" };
  }
}

export async function updateComment(commentId: string, content: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Check if user owns the comment
    const existingComment = await db.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, projectId: true },
    });

    if (!existingComment || existingComment.authorId !== session.user.id) {
      return { error: "Unauthorized to edit this comment" };
    }

    const comment = await db.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Create activity log if it's a project comment
    if (existingComment.projectId) {
      await db.activityLog.create({
        data: {
          userId: session.user.id!,
          projectId: existingComment.projectId,
          action: "COMMENT_UPDATED",
          details: `Comment updated: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
        },
      });

      revalidatePath(`/projects/${existingComment.projectId}`);
    }

    return { success: true, comment };
  } catch (error) {
    console.error("Error updating comment:", error);
    return { error: "Failed to update comment" };
  }
}

export async function deleteComment(commentId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Check if user owns the comment or is admin
    const existingComment = await db.comment.findUnique({
      where: { id: commentId },
      select: {
        authorId: true,
        projectId: true,
        content: true,
      },
    });

    if (!existingComment) {
      return { error: "Comment not found" };
    }

    const isOwner = existingComment.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { error: "Unauthorized to delete this comment" };
    }

    await db.comment.delete({
      where: { id: commentId },
    });

    // Create activity log if it's a project comment
    if (existingComment.projectId) {
      await db.activityLog.create({
        data: {
          userId: session.user.id!,
          projectId: existingComment.projectId,
          action: "COMMENT_DELETED",
          details: `Comment deleted: ${existingComment.content.substring(0, 50)}${existingComment.content.length > 50 ? "..." : ""}`,
        },
      });

      revalidatePath(`/projects/${existingComment.projectId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { error: "Failed to delete comment" };
  }
}

export async function getComments(projectId?: string, parentId?: string) {
  try {
    const comments = await db.comment.findMany({
      where: {
        projectId,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, comments };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return { error: "Failed to fetch comments", comments: [] };
  }
}

export async function exportComments(
  projectId: string,
  format: "json" | "csv" = "json"
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const comments = await db.comment.findMany({
      where: { projectId },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify(comments, null, 2),
        filename: `project-${projectId}-comments.json`,
        mimeType: "application/json",
      };
    } else {
      // CSV format
      const csvRows = [];
      csvRows.push(
        "ID,Content,Author,Email,Role,Created At,Parent ID,Reply Count"
      );

      const flattenComments = (commentList: any[], parentId = "") => {
        commentList.forEach((comment) => {
          csvRows.push(
            [
              comment.id,
              `"${comment.content.replace(/"/g, '""')}"`,
              comment.author.name || "Unknown",
              comment.author.email || "",
              comment.author.role,
              comment.createdAt.toISOString(),
              parentId,
              comment.replies?.length || 0,
            ].join(",")
          );

          if (comment.replies && comment.replies.length > 0) {
            flattenComments(comment.replies, comment.id);
          }
        });
      };

      flattenComments(comments);

      return {
        success: true,
        data: csvRows.join("\n"),
        filename: `project-${projectId}-comments.csv`,
        mimeType: "text/csv",
      };
    }
  } catch (error) {
    console.error("Error exporting comments:", error);
    return { error: "Failed to export comments" };
  }
}
