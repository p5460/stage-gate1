"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sharePointService } from "@/lib/sharepoint";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendDocumentUploadNotification } from "@/lib/notifications";

export async function uploadDocument(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const isRequired = formData.get("isRequired") === "true";
  const file = formData.get("file") as File;

  if (!file || !projectId) {
    return { error: "Missing required fields" };
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to SharePoint
    const sharePointFile = await sharePointService.uploadFile(
      projectId,
      file.name,
      buffer,
      file.type
    );

    // Save document record to database
    const document = await db.document.create({
      data: {
        projectId,
        uploaderId: session.user.id!,
        name: name || file.name,
        description,
        type: type as any,
        fileUrl: sharePointFile.url,
        fileName: sharePointFile.name,
        fileSize: sharePointFile.size,
        mimeType: sharePointFile.mimeType,
        isRequired,
      },
      include: {
        project: {
          include: {
            lead: true,
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        uploader: true,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId,
        action: "DOCUMENT_UPLOADED",
        details: `Document "${name || file.name}" was uploaded`,
      },
    });

    // Send email notifications
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const projectUrl = `${baseUrl}/projects/${projectId}`;

      const recipients = [
        { id: document.project.leadId, email: document.project.lead.email },
        ...document.project.members.map((m: any) => ({
          id: m.userId,
          email: m.user.email,
        })),
      ].filter((r) => r.email && r.id !== session.user.id) as {
        id: string;
        email: string;
      }[];

      if (recipients.length > 0) {
        await sendDocumentUploadNotification(
          {
            projectName: document.project.name,
            projectId: document.project.projectId,
            documentName: document.name,
            documentType: document.type,
            uploadedBy:
              document.uploader.name ||
              document.uploader.email ||
              "Unknown User",
            projectUrl,
          },
          recipients
        );
      }
    } catch (emailError) {
      console.error(
        "Failed to send document upload notifications:",
        emailError
      );
      // Don't fail document upload if email fails
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, documentId: document.id };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { error: "Failed to upload document" };
  }
}

export async function updateDocument(
  documentId: string,
  data: {
    name?: string;
    description?: string;
    type?:
      | "BUSINESS_CASE"
      | "RESEARCH_PLAN"
      | "TECHNICAL_SPEC"
      | "RISK_ASSESSMENT"
      | "BUDGET_PLAN"
      | "MILESTONE_REPORT"
      | "FINAL_REPORT"
      | "OTHER";
    isRequired?: boolean;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const document = await db.document.update({
      where: { id: documentId },
      data,
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: document.projectId,
        action: "DOCUMENT_UPDATED",
        details: `Document ${document.name} was updated`,
      },
    });

    revalidatePath(`/projects/${document.projectId}`);
    return { success: true, document };
  } catch (error) {
    console.error("Error updating document:", error);
    return { error: "Failed to update document" };
  }
}

export async function deleteDocument(documentId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    });

    if (!document) {
      return { error: "Document not found" };
    }

    // Delete from SharePoint (optional - you might want to keep files)
    // await sharePointService.deleteFile(document.fileUrl)

    // Delete from database
    await db.document.delete({
      where: { id: documentId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: document.projectId,
        action: "DOCUMENT_DELETED",
        details: `Document "${document.name}" was deleted`,
      },
    });

    revalidatePath(`/projects/${document.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { error: "Failed to delete document" };
  }
}

export async function approveDocument(documentId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to approve documents
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER", "PROJECT_LEAD"].includes(user.role)) {
    return { error: "Unauthorized to approve documents" };
  }

  try {
    const document = await db.document.update({
      where: { id: documentId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: document.projectId,
        action: "DOCUMENT_APPROVED",
        details: `Document ${document.name} was approved`,
      },
    });

    revalidatePath(`/projects/${document.projectId}`);
    return { success: true, document };
  } catch (error) {
    console.error("Error approving document:", error);
    return { error: "Failed to approve document" };
  }
}

export async function rejectDocument(documentId: string, reason?: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check if user has permission to reject documents
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER", "PROJECT_LEAD"].includes(user.role)) {
    return { error: "Unauthorized to reject documents" };
  }

  try {
    const document = await db.document.update({
      where: { id: documentId },
      data: {
        isApproved: false,
        approvedAt: null,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: document.projectId,
        action: "DOCUMENT_REJECTED",
        details: `Document ${document.name} was rejected${reason ? `: ${reason}` : ""}`,
      },
    });

    revalidatePath(`/projects/${document.projectId}`);
    return { success: true, document };
  } catch (error) {
    console.error("Error rejecting document:", error);
    return { error: "Failed to reject document" };
  }
}
