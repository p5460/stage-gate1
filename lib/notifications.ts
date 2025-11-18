import { sendEmail, emailTemplates } from "@/lib/email";
import { checkUserNotificationPreference } from "@/actions/notifications";
import { db } from "@/lib/db";

export interface NotificationData {
  projectName: string;
  projectId: string;
  projectUrl: string;
}

export interface ReviewSubmissionNotificationData extends NotificationData {
  reviewerName: string;
  stage: string;
  decision: string;
  score?: number;
  comments?: string;
}

export interface ReviewAssignmentNotificationData extends NotificationData {
  stage: string;
  reviewerName: string;
  assignedBy: string;
  dueDate?: string;
}

export interface ProjectStatusUpdateNotificationData extends NotificationData {
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  reason?: string;
}

export async function sendReviewSubmissionNotification(
  data: ReviewSubmissionNotificationData,
  recipients: { id: string; email: string }[]
) {
  const emailTemplate = emailTemplates.reviewSubmitted(data);

  for (const recipient of recipients) {
    if (recipient.email) {
      const shouldNotify = await checkUserNotificationPreference(
        recipient.id,
        "reviewSubmissions"
      );
      if (shouldNotify) {
        await sendEmail({
          to: recipient.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }
    }
  }
}

export async function sendReviewAssignmentNotification(
  data: ReviewAssignmentNotificationData,
  recipientId: string,
  recipientEmail: string
) {
  const shouldNotify = await checkUserNotificationPreference(
    recipientId,
    "reviewAssignments"
  );

  if (shouldNotify && recipientEmail) {
    const emailTemplate = emailTemplates.reviewAssigned(data);

    await sendEmail({
      to: recipientEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
  }
}

export async function sendProjectStatusUpdateNotification(
  data: ProjectStatusUpdateNotificationData,
  recipients: { id: string; email: string }[]
) {
  const emailTemplate = emailTemplates.projectStatusUpdate(data);

  for (const recipient of recipients) {
    if (recipient.email) {
      const shouldNotify = await checkUserNotificationPreference(
        recipient.id,
        "statusChanges"
      );
      if (shouldNotify) {
        await sendEmail({
          to: recipient.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }
    }
  }
}

export async function sendDocumentUploadNotification(
  data: {
    projectName: string;
    projectId: string;
    documentName: string;
    documentType: string;
    uploadedBy: string;
    projectUrl: string;
  },
  recipients: { id: string; email: string }[]
) {
  const emailTemplate = emailTemplates.documentUploaded(data);

  for (const recipient of recipients) {
    if (recipient.email) {
      const shouldNotify = await checkUserNotificationPreference(
        recipient.id,
        "documentUploads"
      );
      if (shouldNotify) {
        await sendEmail({
          to: recipient.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }
    }
  }
}

export async function sendMilestoneReminderNotification(
  data: {
    projectName: string;
    projectId: string;
    milestoneName: string;
    dueDate: string;
    daysUntilDue: number;
    projectUrl: string;
  },
  recipients: { id: string; email: string }[]
) {
  const emailTemplate = emailTemplates.milestoneReminder(data);

  for (const recipient of recipients) {
    if (recipient.email) {
      const shouldNotify = await checkUserNotificationPreference(
        recipient.id,
        "milestoneReminders"
      );
      if (shouldNotify) {
        await sendEmail({
          to: recipient.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }
    }
  }
}

export async function sendMilestoneCompletedNotification(
  data: {
    projectName: string;
    projectId: string;
    milestoneName: string;
    completedBy: string;
    projectUrl: string;
  },
  recipients: { id: string; email: string }[]
) {
  const emailTemplate = emailTemplates.milestoneCompleted(data);

  for (const recipient of recipients) {
    if (recipient.email) {
      const shouldNotify = await checkUserNotificationPreference(
        recipient.id,
        "projectUpdates"
      );
      if (shouldNotify) {
        await sendEmail({
          to: recipient.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }
    }
  }
}

export async function sendProjectNotification(
  recipientEmail: string,
  recipientName: string,
  projectName: string,
  projectId: string,
  subject: string,
  message: string,
  projectUrl: string
) {
  try {
    await sendEmail({
      to: recipientEmail,
      subject: `${subject}: ${projectName} (${projectId})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">${subject}</h2>
          </div>
          
          <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
            <p>Hello ${recipientName},</p>
            
            <h3 style="color: #495057; margin-top: 0;">Project: ${projectName}</h3>
            <p><strong>Project ID:</strong> ${projectId}</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0;">${message}</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <a href="${projectUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Project Details
              </a>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; text-align: center; color: #6c757d; font-size: 14px;">
            <p>This is an automated notification from the CSIR Stage-Gate Platform.</p>
          </div>
        </div>
      `,
      text: `
${subject}: ${projectName} (${projectId})

Hello ${recipientName},

Project: ${projectName}
Project ID: ${projectId}

${message}

View project details: ${projectUrl}
      `,
    });
  } catch (error) {
    console.error("Failed to send project notification:", error);
  }
}

export async function sendRedFlagNotification(
  projectId: string,
  flagTitle: string,
  flagDescription: string,
  raisedBy: string
) {
  try {
    // Get project details
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        lead: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) return;

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const projectUrl = `${baseUrl}/projects/${project.id}`;

    // Get all stakeholders (lead, members, admins, gatekeepers)
    const stakeholders = [
      { id: project.leadId, email: project.lead.email },
      ...project.members.map((m: any) => ({
        id: m.userId,
        email: m.user.email,
      })),
    ].filter((s) => s.email) as { id: string; email: string }[];

    // Get admins and gatekeepers
    const adminGatekeepers = await db.user.findMany({
      where: {
        role: { in: ["ADMIN", "GATEKEEPER"] },
        email: { not: null },
      },
      select: { id: true, email: true },
    });

    const allRecipients = [...stakeholders, ...adminGatekeepers].filter(
      (r) => r.email
    ) as { id: string; email: string }[];

    // Remove duplicates
    const uniqueRecipients = allRecipients.filter(
      (recipient, index, self) =>
        index === self.findIndex((r) => r.id === recipient.id)
    );

    // Send notifications
    for (const recipient of uniqueRecipients) {
      const shouldNotify = await checkUserNotificationPreference(
        recipient.id,
        "redFlagAlerts"
      );
      if (shouldNotify && recipient.email) {
        await sendEmail({
          to: recipient.email,
          subject: `Red Flag Alert: ${project.name} (${project.projectId})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #fee; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
                <h2 style="color: #dc3545; margin: 0;">Red Flag Alert</h2>
              </div>
              
              <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
                <h3 style="color: #495057; margin-top: 0;">Project: ${project.name}</h3>
                <p><strong>Project ID:</strong> ${project.projectId}</p>
                <p><strong>Raised by:</strong> ${raisedBy}</p>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <h4 style="margin: 0 0 10px 0; color: #856404;">${flagTitle}</h4>
                  <p style="margin: 0; color: #856404;">${flagDescription}</p>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                  <a href="${projectUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Project Details
                  </a>
                </div>
              </div>
            </div>
          `,
          text: `
Red Flag Alert: ${project.name} (${project.projectId})

Project: ${project.name}
Project ID: ${project.projectId}
Raised by: ${raisedBy}

${flagTitle}
${flagDescription}

View project details: ${projectUrl}
          `,
        });
      }
    }
  } catch (error) {
    console.error("Failed to send red flag notifications:", error);
  }
}
