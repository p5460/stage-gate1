"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sharePointService } from "@/lib/sharepoint";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getAllTemplates() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const templates = await db.template.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return { success: true, templates };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { error: "Failed to fetch templates" };
  }
}

export async function createTemplate(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check permissions
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
    return { error: "Unauthorized to create templates" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const stage = formData.get("stage") as string;
  const file = formData.get("file") as File;

  if (!file || !name || !type) {
    return { error: "Missing required fields" };
  }

  try {
    // Upload template file to SharePoint
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sharePointFile = await sharePointService.uploadFile(
      "templates",
      file.name,
      buffer,
      file.type
    );

    // Create template record
    const template = await db.template.create({
      data: {
        name,
        description,
        type: type as any,
        stage: stage ? (stage as any) : null,
        fileUrl: sharePointFile.url,
        fileName: sharePointFile.name,
        isActive: true,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "TEMPLATE_CREATED",
        details: `Template "${name}" created`,
      },
    });

    revalidatePath("/templates");
    revalidatePath("/admin");
    return { success: true, templateId: template.id };
  } catch (error) {
    console.error("Error creating template:", error);
    return { error: "Failed to create template" };
  }
}

export async function updateTemplate(
  templateId: string,
  data: {
    name?: string;
    description?: string;
    type?: string;
    stage?: string;
    isActive?: boolean;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check permissions
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
    return { error: "Unauthorized to update templates" };
  }

  try {
    const template = await db.template.update({
      where: { id: templateId },
      data: {
        ...data,
        type: data.type as any,
        stage: data.stage ? (data.stage as any) : null,
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "TEMPLATE_UPDATED",
        details: `Template "${template.name}" updated`,
      },
    });

    revalidatePath("/templates");
    revalidatePath("/admin");
    return { success: true, template };
  } catch (error) {
    console.error("Error updating template:", error);
    return { error: "Failed to update template" };
  }
}

export async function deleteTemplate(templateId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Check permissions
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || user.role !== "ADMIN") {
    return { error: "Unauthorized to delete templates" };
  }

  try {
    const template = await db.template.delete({
      where: { id: templateId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "TEMPLATE_DELETED",
        details: `Template "${template.name}" deleted`,
      },
    });

    revalidatePath("/templates");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { error: "Failed to delete template" };
  }
}

export async function downloadTemplate(templateId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const template = await db.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "TEMPLATE_DOWNLOADED",
        details: `Template "${template.name}" downloaded`,
      },
    });

    return {
      success: true,
      template: {
        name: template.name,
        fileName: template.fileName,
        fileUrl: template.fileUrl,
      },
    };
  } catch (error) {
    console.error("Error downloading template:", error);
    return { error: "Failed to download template" };
  }
}

export async function getTemplatesByType(type: string, stage?: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const where: any = {
      type: type as any,
      isActive: true,
    };

    if (stage) {
      where.OR = [{ stage: stage as any }, { stage: null }];
    }

    const templates = await db.template.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return { success: true, templates };
  } catch (error) {
    console.error("Error fetching templates by type:", error);
    return { error: "Failed to fetch templates" };
  }
}
