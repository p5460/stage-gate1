"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail, emailTemplates } from "@/lib/email";
import { checkUserNotificationPreference } from "@/actions/notifications";
import { sendProjectStatusUpdateNotification } from "@/lib/notifications";

export async function createProject(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const businessCase = formData.get("businessCase") as string;
  const clusterId = formData.get("clusterId") as string;
  const budget = parseFloat(formData.get("budget") as string) || 0;
  const duration = parseInt(formData.get("duration") as string) || 0;
  const technologyReadiness = formData.get("technologyReadiness") as string;
  const ipPotential = formData.get("ipPotential") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  try {
    // Generate project ID
    const projectCount = await db.project.count();
    const projectId = `STP-${String(projectCount + 1).padStart(4, "0")}`;

    const project = await db.project.create({
      data: {
        projectId,
        name,
        description,
        businessCase,
        clusterId,
        leadId: session.user.id!,
        budget,
        duration,
        technologyReadiness,
        ipPotential,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    // Create initial activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: project.id,
        action: "PROJECT_CREATED",
        details: `Project ${project.name} was created`,
      },
    });

    // Send email notifications for new project
    try {
      const user = await db.user.findUnique({
        where: { id: session.user.id! },
        include: { customRole: true },
      });

      const cluster = await db.cluster.findUnique({
        where: { id: clusterId },
      });

      if (user && cluster) {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const projectUrl = `${baseUrl}/projects/${project.id}`;

        // Notify admins and gatekeepers about new project
        const notificationRecipients = await db.user.findMany({
          where: {
            role: { in: ["ADMIN", "GATEKEEPER"] },
            email: { not: null },
          },
          select: { id: true, email: true },
        });

        for (const recipient of notificationRecipients) {
          if (recipient.email) {
            const shouldNotify = await checkUserNotificationPreference(
              recipient.id,
              "projectUpdates"
            );
            if (shouldNotify) {
              await sendEmail({
                to: recipient.email,
                subject: `New Project Created: ${project.name} (${project.projectId})`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                      <h2 style="color: #1976d2; margin: 0;">New Project Created</h2>
                    </div>
                    
                    <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
                      <h3 style="color: #495057; margin-top: 0;">${project.name}</h3>
                      <p><strong>Project ID:</strong> ${project.projectId}</p>
                      <p><strong>Lead:</strong> ${user.name || user.email}</p>
                      <p><strong>Cluster:</strong> ${cluster.name}</p>
                      ${project.description ? `<p><strong>Description:</strong> ${project.description}</p>` : ""}
                      ${project.budget ? `<p><strong>Budget:</strong> $${project.budget.toLocaleString()}</p>` : ""}
                      
                      <div style="margin-top: 30px; text-align: center;">
                        <a href="${projectUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                          View Project Details
                        </a>
                      </div>
                    </div>
                  </div>
                `,
                text: `
New Project Created: ${project.name} (${project.projectId})

Project: ${project.name}
Project ID: ${project.projectId}
Lead: ${user.name || user.email}
Cluster: ${cluster.name}
${project.description ? `Description: ${project.description}` : ""}
${project.budget ? `Budget: $${project.budget.toLocaleString()}` : ""}

View project details: ${projectUrl}
                `,
              });
            }
          }
        }
      }
    } catch (emailError) {
      console.error(
        "Failed to send project creation notifications:",
        emailError
      );
      // Don't fail project creation if email fails
    }

    revalidatePath("/projects");
    return { success: true, projectId: project.id };
  } catch (error) {
    console.error("Error creating project:", error);
    return { error: "Failed to create project" };
  }
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    businessCase?: string;
    clusterId?: string;
    budget?: number;
    budgetUtilization?: number;
    duration?: number;
    technologyReadiness?: string;
    ipPotential?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    leadId?: string;
  }
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Check if user has permission to edit this project
    const existingProject = await db.project.findUnique({
      where: { id: projectId },
      include: { lead: true },
    });

    if (!existingProject) {
      return { error: "Project not found" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check permissions
    const canEdit =
      user.role === "ADMIN" ||
      (user.role === "PROJECT_LEAD" && existingProject.leadId === user.id) ||
      user.role === "GATEKEEPER";

    if (!canEdit) {
      return { error: "Unauthorized to edit this project" };
    }

    const project = await db.project.update({
      where: { id: projectId },
      data: {
        ...data,
        status: data.status as any,
      },
      include: {
        lead: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: project.id,
        action: "PROJECT_UPDATED",
        details: `Project ${project.name} was updated`,
      },
    });

    // Send status change notifications if status was updated
    if (data.status && data.status !== existingProject.status) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const projectUrl = `${baseUrl}/projects/${projectId}`;

        const recipients = [
          { id: project.leadId, email: project.lead.email },
          ...project.members.map((m: any) => ({
            id: m.userId,
            email: m.user.email,
          })),
        ].filter((r) => r.email && r.id !== session.user.id) as {
          id: string;
          email: string;
        }[];

        if (recipients.length > 0) {
          await sendProjectStatusUpdateNotification(
            {
              projectName: project.name,
              projectId: project.projectId,
              oldStatus: existingProject.status,
              newStatus: data.status,
              updatedBy: user.name || user.email || "Unknown User",
              projectUrl,
            },
            recipients
          );
        }
      } catch (emailError) {
        console.error(
          "Failed to send status change notifications:",
          emailError
        );
        // Don't fail project update if email fails
      }
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, project };
  } catch (error) {
    console.error("Error updating project:", error);
    return { error: "Failed to update project" };
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Check if user has permission to delete this project
    const existingProject = await db.project.findUnique({
      where: { id: projectId },
      include: { lead: true },
    });

    if (!existingProject) {
      return { error: "Project not found" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Only admins can delete projects
    if (user.role !== "ADMIN") {
      return { error: "Unauthorized to delete projects" };
    }

    // Delete the project (cascade will handle related records)
    await db.project.delete({
      where: { id: projectId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "PROJECT_DELETED",
        details: `Project ${existingProject.name} was deleted`,
      },
    });

    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { error: "Failed to delete project" };
  }
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: string
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Check if user has permission to manage project members
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { lead: true },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!currentUser) {
      return { error: "User not found" };
    }

    // Check permissions
    const canManage =
      currentUser.role === "ADMIN" ||
      currentUser.role === "GATEKEEPER" ||
      (currentUser.role === "PROJECT_LEAD" &&
        project.leadId === currentUser.id);

    if (!canManage) {
      return { error: "Unauthorized to manage project members" };
    }

    // Check if user is already a member
    const existingMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingMember) {
      return { error: "User is already a member of this project" };
    }

    const member = await db.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId,
        action: "MEMBER_ADDED",
        details: `${member.user.name || member.user.email} was added as ${role}`,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { success: true, member };
  } catch (error) {
    console.error("Error adding project member:", error);
    return { error: "Failed to add project member" };
  }
}

export async function removeProjectMember(memberId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Get the member details first
    const member = await db.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!member) {
      return { error: "Member not found" };
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!currentUser) {
      return { error: "User not found" };
    }

    // Check permissions
    const canManage =
      currentUser.role === "ADMIN" ||
      currentUser.role === "GATEKEEPER" ||
      (currentUser.role === "PROJECT_LEAD" &&
        member.project.leadId === currentUser.id);

    if (!canManage) {
      return { error: "Unauthorized to manage project members" };
    }

    // Remove the member
    await db.projectMember.delete({
      where: { id: memberId },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: member.projectId,
        action: "MEMBER_REMOVED",
        details: `${member.user.name || member.user.email} was removed from the project`,
      },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${member.projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing project member:", error);
    return { error: "Failed to remove project member" };
  }
}

export async function getAllProjects() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return { error: "User not found" };
    }

    let projects;

    // Admins and gatekeepers can see all projects
    if (user.role === "ADMIN" || user.role === "GATEKEEPER") {
      projects = await db.project.findMany({
        include: {
          cluster: true,
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              documents: true,
              redFlags: true,
              milestones: true,
              gateReviews: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Other users can only see projects they lead or are members of
      projects = await db.project.findMany({
        where: {
          OR: [
            { leadId: user.id },
            {
              members: {
                some: {
                  userId: user.id,
                },
              },
            },
          ],
        },
        include: {
          cluster: true,
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              documents: true,
              redFlags: true,
              milestones: true,
              gateReviews: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return { success: true, projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { error: "Failed to fetch projects" };
  }
}

export async function getProjectById(projectId: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        cluster: true,
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        documents: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        redFlags: {
          include: {
            raisedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
        },
        gateReviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    // Check if user has access to this project
    const hasAccess =
      user.role === "ADMIN" ||
      user.role === "GATEKEEPER" ||
      user.role === "REVIEWER" ||
      project.leadId === user.id ||
      project.members.some((member: any) => member.userId === user.id);

    if (!hasAccess) {
      return { error: "Unauthorized to view this project" };
    }

    return { success: true, project };
  } catch (error) {
    console.error("Error fetching project:", error);
    return { error: "Failed to fetch project" };
  }
}

export async function updateProjectStage(projectId: string, newStage: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const project = await db.project.update({
      where: { id: projectId },
      data: { currentStage: newStage as any },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: project.id,
        action: "STAGE_UPDATED",
        details: `Project moved to ${newStage}`,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating project stage:", error);
    return { error: "Failed to update project stage" };
  }
}

export async function raiseRedFlag(
  projectId: string,
  title: string,
  description: string,
  severity: string
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const redFlag = await db.redFlag.create({
      data: {
        projectId,
        raisedById: session.user.id!,
        title,
        description,
        severity,
      },
    });

    // Update project status to RED_FLAG
    await db.project.update({
      where: { id: projectId },
      data: { status: "RED_FLAG" },
    });

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId,
        action: "RED_FLAG_RAISED",
        details: `Red flag raised: ${title}`,
      },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error raising red flag:", error);
    return { error: "Failed to raise red flag" };
  }
}
export async function exportProject(
  projectId: string,
  format: "json" | "csv" | "pdf" | "pptx" = "json"
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    // Get comprehensive project data
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        lead: {
          select: {
            name: true,
            email: true,
            department: true,
            position: true,
          },
        },
        cluster: {
          select: {
            name: true,
            description: true,
            color: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                department: true,
                position: true,
              },
            },
          },
        },
        gateReviews: {
          include: {
            reviewer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        documents: {
          select: {
            name: true,
            description: true,
            type: true,
            fileName: true,
            fileSize: true,
            isRequired: true,
            isApproved: true,
            version: true,
            createdAt: true,
            uploader: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        redFlags: {
          include: {
            raisedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
        },
        comments: {
          include: {
            author: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    // Check if user has access to this project
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    const hasAccess =
      user?.role === "ADMIN" ||
      user?.role === "GATEKEEPER" ||
      project.leadId === session.user.id ||
      project.members.some((member: any) => member.userId === session.user.id);

    if (!hasAccess) {
      return { error: "Unauthorized to export this project" };
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: project.id,
        action: "PROJECT_EXPORTED",
        details: `Project exported in ${format.toUpperCase()} format`,
      },
    });

    // Handle PDF and PowerPoint exports by calling the API
    if (format === "pdf" || format === "pptx") {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/api/projects/${projectId}/export?format=${format}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Export API returned ${response.status}`);
        }

        const data = await response.text();
        const contentType = response.headers.get("content-type") || "";
        const contentDisposition =
          response.headers.get("content-disposition") || "";

        // Extract filename from content-disposition header
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        const filename = filenameMatch
          ? filenameMatch[1]
          : `project-${project.projectId}-${format}.${format === "pdf" ? "txt" : "json"}`;

        return {
          success: true,
          data,
          filename,
          mimeType: contentType,
        };
      } catch (error) {
        console.error(
          `Error generating ${format.toUpperCase()} export:`,
          error
        );
        return { error: `Failed to generate ${format.toUpperCase()} export` };
      }
    }

    if (format === "csv") {
      // Create CSV format
      const csvData = [
        // Project basic info
        "Section,Field,Value",
        `Project,ID,${project.projectId}`,
        `Project,Name,${project.name}`,
        `Project,Description,"${project.description || ""}"`,
        `Project,Status,${project.status}`,
        `Project,Stage,${project.currentStage}`,
        `Project,Budget,${project.budget || 0}`,
        `Project,Budget Utilization,${project.budgetUtilization || 0}%`,
        `Project,Duration,${project.duration || 0} months`,
        `Project,Technology Readiness,${project.technologyReadiness || ""}`,
        `Project,IP Potential,${project.ipPotential || ""}`,
        `Project,Start Date,${project.startDate?.toISOString().split("T")[0] || ""}`,
        `Project,End Date,${project.endDate?.toISOString().split("T")[0] || ""}`,
        `Project,Lead,${project.lead.name}`,
        `Project,Cluster,${project.cluster.name}`,
        "",
        // Team members
        "Team Members,Name,Email,Role",
        ...project.members.map(
          (member: any) =>
            `Team,${member.user.name},${member.user.email},${member.role}`
        ),
        "",
        // Gate reviews
        "Gate Reviews,Stage,Decision,Score,Reviewer,Date",
        ...project.gateReviews.map(
          (review: any) =>
            `Gate Review,${review.stage},${review.decision || "Pending"},${review.score || ""},${review.reviewer.name},${review.reviewDate?.toISOString().split("T")[0] || ""}`
        ),
        "",
        // Documents
        "Documents,Name,Type,Status,Uploader,Date",
        ...project.documents.map(
          (doc: any) =>
            `Document,${doc.name},${doc.type},${doc.isApproved ? "Approved" : "Pending"},${doc.uploader.name},${doc.createdAt.toISOString().split("T")[0]}`
        ),
        "",
        // Red flags
        "Red Flags,Title,Severity,Status,Raised By,Date",
        ...project.redFlags.map(
          (flag: any) =>
            `Red Flag,${flag.title},${flag.severity},${flag.status},${flag.raisedBy.name},${flag.createdAt.toISOString().split("T")[0]}`
        ),
        "",
        // Milestones
        "Milestones,Title,Due Date,Progress,Status",
        ...project.milestones.map(
          (milestone: any) =>
            `Milestone,${milestone.title},${milestone.dueDate.toISOString().split("T")[0]},${milestone.progress}%,${milestone.isCompleted ? "Completed" : "In Progress"}`
        ),
      ].join("\n");

      return {
        success: true,
        data: csvData,
        filename: `project-${project.projectId}-${new Date().toISOString().split("T")[0]}.csv`,
        mimeType: "text/csv",
      };
    }

    // Return JSON format
    const exportData = {
      ...project,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        name: user?.name,
        email: user?.email,
      },
    };

    return {
      success: true,
      data: JSON.stringify(exportData, null, 2),
      filename: `project-${project.projectId}-${new Date().toISOString().split("T")[0]}.json`,
      mimeType: "application/json",
    };
  } catch (error) {
    console.error("Error exporting project:", error);
    return { error: "Failed to export project" };
  }
}

export async function exportMultipleProjects(
  projectIds: string[],
  format: "json" | "csv" | "pdf" | "pptx" = "json"
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    // Build query based on user permissions
    const whereClause =
      user?.role === "ADMIN" || user?.role === "GATEKEEPER"
        ? { id: { in: projectIds } }
        : {
            id: { in: projectIds },
            OR: [
              { leadId: session.user.id },
              { members: { some: { userId: session.user.id } } },
            ],
          };

    const projects = await db.project.findMany({
      where: whereClause,
      include: {
        lead: {
          select: {
            name: true,
            email: true,
          },
        },
        cluster: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            documents: true,
            redFlags: true,
            gateReviews: true,
            members: true,
            comments: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (projects.length === 0) {
      return { error: "No accessible projects found" };
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "PROJECTS_BULK_EXPORTED",
        details: `${projects.length} projects exported in ${format.toUpperCase()} format`,
      },
    });

    if (format === "csv") {
      const csvData = [
        "ID,Name,Status,Stage,Budget,Utilization,Lead,Cluster,Documents,Red Flags,Gate Reviews,Members,Created,Updated",
        ...projects.map(
          (project: any) =>
            `${project.projectId},${project.name},${project.status},${project.currentStage},${project.budget || 0},${project.budgetUtilization || 0}%,${project.lead.name},${project.cluster.name},${project._count.documents},${project._count.redFlags},${project._count.gateReviews},${project._count.members},${project.createdAt.toISOString().split("T")[0]},${project.updatedAt.toISOString().split("T")[0]}`
        ),
      ].join("\n");

      return {
        success: true,
        data: csvData,
        filename: `projects-export-${new Date().toISOString().split("T")[0]}.csv`,
        mimeType: "text/csv",
      };
    }

    // Return JSON format
    const exportData = {
      projects,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        name: user?.name,
        email: user?.email,
      },
      totalProjects: projects.length,
    };

    return {
      success: true,
      data: JSON.stringify(exportData, null, 2),
      filename: `projects-export-${new Date().toISOString().split("T")[0]}.json`,
      mimeType: "application/json",
    };
  } catch (error) {
    console.error("Error exporting projects:", error);
    return { error: "Failed to export projects" };
  }
}
