import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "CSIR Stage-Gate Platform <noreply@csir-stagegate.com>",
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent: %s", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Email templates
export const emailTemplates = {
  reviewSubmitted: (data: {
    projectName: string;
    projectId: string;
    reviewerName: string;
    stage: string;
    decision: string;
    score?: number;
    comments?: string;
    projectUrl: string;
  }) => ({
    subject: `Review Submitted: ${data.projectName} (${data.projectId})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Review Submitted</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <h3 style="color: #495057; margin-top: 0;">Project: ${data.projectName}</h3>
          <p><strong>Project ID:</strong> ${data.projectId}</p>
          <p><strong>Stage:</strong> ${data.stage}</p>
          <p><strong>Reviewer:</strong> ${data.reviewerName}</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #495057;">Review Results</h4>
            <p><strong>Decision:</strong> <span style="color: ${getDecisionColor(data.decision)}; font-weight: bold;">${data.decision}</span></p>
            ${data.score ? `<p><strong>Score:</strong> ${data.score}/5.0</p>` : ""}
          </div>
          
          ${
            data.comments
              ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">Comments</h4>
              <p style="margin: 0; color: #856404;">${data.comments}</p>
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${data.projectUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
Review Submitted: ${data.projectName} (${data.projectId})

Project: ${data.projectName}
Project ID: ${data.projectId}
Stage: ${data.stage}
Reviewer: ${data.reviewerName}
Decision: ${data.decision}
${data.score ? `Score: ${data.score}/5.0` : ""}

${data.comments ? `Comments: ${data.comments}` : ""}

View project details: ${data.projectUrl}
    `,
  }),

  reviewAssigned: (data: {
    projectName: string;
    projectId: string;
    stage: string;
    reviewerName: string;
    assignedBy: string;
    dueDate?: string;
    projectUrl: string;
  }) => ({
    subject: `Review Assignment: ${data.projectName} (${data.projectId})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1976d2; margin: 0;">New Review Assignment</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <p>Hello ${data.reviewerName},</p>
          
          <p>You have been assigned to review the following project:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #495057;">${data.projectName}</h3>
            <p><strong>Project ID:</strong> ${data.projectId}</p>
            <p><strong>Stage:</strong> ${data.stage}</p>
            <p><strong>Assigned by:</strong> ${data.assignedBy}</p>
            ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate}</p>` : ""}
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${data.projectUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Start Review
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>This is an automated notification from the CSIR Stage-Gate Platform.</p>
        </div>
      </div>
    `,
    text: `
New Review Assignment: ${data.projectName} (${data.projectId})

Hello ${data.reviewerName},

You have been assigned to review the following project:

Project: ${data.projectName}
Project ID: ${data.projectId}
Stage: ${data.stage}
Assigned by: ${data.assignedBy}
${data.dueDate ? `Due Date: ${data.dueDate}` : ""}

Start review: ${data.projectUrl}
    `,
  }),

  documentUploaded: (data: {
    projectName: string;
    projectId: string;
    documentName: string;
    documentType: string;
    uploadedBy: string;
    projectUrl: string;
  }) => ({
    subject: `New Document Uploaded: ${data.projectName} (${data.projectId})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2d5a2d; margin: 0;">Document Uploaded</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <h3 style="color: #495057; margin-top: 0;">Project: ${data.projectName}</h3>
          <p><strong>Project ID:</strong> ${data.projectId}</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #495057;">Document Details</h4>
            <p><strong>Document:</strong> ${data.documentName}</p>
            <p><strong>Type:</strong> ${data.documentType}</p>
            <p><strong>Uploaded by:</strong> ${data.uploadedBy}</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${data.projectUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Document
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>This is an automated notification from the CSIR Stage-Gate Platform.</p>
        </div>
      </div>
    `,
    text: `
Document Uploaded: ${data.projectName} (${data.projectId})

Project: ${data.projectName}
Project ID: ${data.projectId}

Document: ${data.documentName}
Type: ${data.documentType}
Uploaded by: ${data.uploadedBy}

View document: ${data.projectUrl}
    `,
  }),

  milestoneReminder: (data: {
    projectName: string;
    projectId: string;
    milestoneName: string;
    dueDate: string;
    daysUntilDue: number;
    projectUrl: string;
  }) => ({
    subject: `Milestone Due Soon: ${data.milestoneName} - ${data.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${data.daysUntilDue <= 1 ? "#fee" : "#fff3cd"}; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${data.daysUntilDue <= 1 ? "#dc3545" : "#ffc107"};">
          <h2 style="color: ${data.daysUntilDue <= 1 ? "#dc3545" : "#856404"}; margin: 0;">Milestone ${data.daysUntilDue <= 1 ? "Overdue" : "Reminder"}</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <h3 style="color: #495057; margin-top: 0;">Project: ${data.projectName}</h3>
          <p><strong>Project ID:</strong> ${data.projectId}</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #495057;">Milestone Details</h4>
            <p><strong>Milestone:</strong> ${data.milestoneName}</p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            <p><strong>Status:</strong> ${data.daysUntilDue <= 0 ? "Overdue" : `Due in ${data.daysUntilDue} day${data.daysUntilDue === 1 ? "" : "s"}`}</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${data.projectUrl}" style="background-color: ${data.daysUntilDue <= 1 ? "#dc3545" : "#ffc107"}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Project
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>This is an automated notification from the CSIR Stage-Gate Platform.</p>
        </div>
      </div>
    `,
    text: `
Milestone ${data.daysUntilDue <= 1 ? "Overdue" : "Reminder"}: ${data.milestoneName}

Project: ${data.projectName}
Project ID: ${data.projectId}

Milestone: ${data.milestoneName}
Due Date: ${data.dueDate}
Status: ${data.daysUntilDue <= 0 ? "Overdue" : `Due in ${data.daysUntilDue} day${data.daysUntilDue === 1 ? "" : "s"}`}

View project: ${data.projectUrl}
    `,
  }),

  milestoneCompleted: (data: {
    projectName: string;
    projectId: string;
    milestoneName: string;
    completedBy: string;
    projectUrl: string;
  }) => ({
    subject: `Milestone Completed: ${data.milestoneName} - ${data.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
          <h2 style="color: #155724; margin: 0;">Milestone Completed</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <h3 style="color: #495057; margin-top: 0;">Project: ${data.projectName}</h3>
          <p><strong>Project ID:</strong> ${data.projectId}</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #495057;">Milestone Details</h4>
            <p><strong>Milestone:</strong> ${data.milestoneName}</p>
            <p><strong>Completed by:</strong> ${data.completedBy}</p>
            <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✓ Completed</span></p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${data.projectUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Project
            </a>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>This is an automated notification from the CSIR Stage-Gate Platform.</p>
        </div>
      </div>
    `,
    text: `
Milestone Completed: ${data.milestoneName}

Project: ${data.projectName}
Project ID: ${data.projectId}

Milestone: ${data.milestoneName}
Completed by: ${data.completedBy}
Status: ✓ Completed

View project: ${data.projectUrl}
    `,
  }),

  projectStatusUpdate: (data: {
    projectName: string;
    projectId: string;
    oldStatus: string;
    newStatus: string;
    updatedBy: string;
    reason?: string;
    projectUrl: string;
  }) => ({
    subject: `Project Status Update: ${data.projectName} (${data.projectId})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #856404; margin: 0;">Project Status Update</h2>
        </div>
        
        <div style="padding: 20px; background-color: white; border: 1px solid #e9ecef; border-radius: 8px;">
          <h3 style="color: #495057; margin-top: 0;">Project: ${data.projectName}</h3>
          <p><strong>Project ID:</strong> ${data.projectId}</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Status Changed:</strong></p>
            <p>From: <span style="color: #dc3545;">${data.oldStatus}</span></p>
            <p>To: <span style="color: #28a745;">${data.newStatus}</span></p>
            <p><strong>Updated by:</strong> ${data.updatedBy}</p>
          </div>
          
          ${
            data.reason
              ? `
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h4 style="margin: 0 0 10px 0; color: #004085;">Reason</h4>
              <p style="margin: 0; color: #004085;">${data.reason}</p>
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${data.projectUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
Project Status Update: ${data.projectName} (${data.projectId})

Project: ${data.projectName}
Project ID: ${data.projectId}

Status Changed:
From: ${data.oldStatus}
To: ${data.newStatus}
Updated by: ${data.updatedBy}

${data.reason ? `Reason: ${data.reason}` : ""}

View project details: ${data.projectUrl}
    `,
  }),
};

function getDecisionColor(decision: string): string {
  switch (decision) {
    case "GO":
      return "#28a745";
    case "RECYCLE":
      return "#ffc107";
    case "HOLD":
      return "#6c757d";
    case "STOP":
      return "#dc3545";
    default:
      return "#6c757d";
  }
}
