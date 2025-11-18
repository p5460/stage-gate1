"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail, emailTemplates } from "@/lib/email";
import { checkUserNotificationPreference } from "@/actions/notifications";

export async function submitReview(reviewData: {
  projectId: string;
  stage: string;
  score?: number;
  comments?: string;
  decision?: string;
  evaluationData?: any;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user has permission to review
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    const canReview =
      user?.role === "ADMIN" ||
      user?.role === "GATEKEEPER" ||
      user?.role === "REVIEWER";

    if (!canReview) {
      return { error: "You don't have permission to conduct reviews" };
    }

    // Check if review already exists
    const existingReview = await db.gateReview.findFirst({
      where: {
        projectId: reviewData.projectId,
        reviewerId: session.user.id!,
        stage: reviewData.stage as any,
      },
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await db.gateReview.update({
        where: { id: existingReview.id },
        data: {
          score: reviewData.score,
          comments: reviewData.comments,
          decision: reviewData.decision as any,
          isCompleted: true,
          reviewDate: new Date(),
        },
      });
    } else {
      // Create new review
      review = await db.gateReview.create({
        data: {
          projectId: reviewData.projectId,
          reviewerId: session.user.id!,
          stage: reviewData.stage as any,
          score: reviewData.score,
          comments: reviewData.comments,
          decision: reviewData.decision as any,
          isCompleted: true,
          reviewDate: new Date(),
        },
      });
    }

    // Create activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id!,
        projectId: reviewData.projectId,
        action: "REVIEW_SUBMITTED",
        details: `Review submitted for ${reviewData.stage}`,
      },
    });

    // Send email notifications
    try {
      // Get project details for email
      const project = await db.project.findUnique({
        where: { id: reviewData.projectId },
        include: {
          lead: true,
          cluster: true,
        },
      });

      if (project && user) {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const projectUrl = `${baseUrl}/projects/${project.id}`;

        // Prepare email data
        const emailData = {
          projectName: project.name,
          projectId: project.projectId,
          reviewerName: user.name || user.email || "Unknown Reviewer",
          stage: reviewData.stage.replace("STAGE_", "Stage "),
          decision: reviewData.decision || "Not specified",
          score: reviewData.score,
          comments: reviewData.comments,
          projectUrl,
        };

        const emailTemplate = emailTemplates.reviewSubmitted(emailData);

        // Send email to project lead (check preferences)
        if (project.lead.email) {
          const shouldNotify = await checkUserNotificationPreference(
            project.leadId,
            "reviewSubmissions"
          );
          if (shouldNotify) {
            await sendEmail({
              to: project.lead.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text,
            });
          }
        }

        // Send email to gatekeepers and admins (check preferences)
        const notificationRecipients = await db.user.findMany({
          where: {
            role: {
              in: ["ADMIN", "GATEKEEPER"],
            },
            email: {
              not: null,
            },
          },
          select: {
            id: true,
            email: true,
          },
        });

        for (const recipient of notificationRecipients) {
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
    } catch (emailError) {
      console.error("Failed to send email notifications:", emailError);
      // Don't fail the review submission if email fails
    }

    // Revalidate relevant paths
    revalidatePath(`/projects/${reviewData.projectId}/review`);
    revalidatePath(`/reviews/${reviewData.projectId}`);

    return { success: true, review };
  } catch (error) {
    console.error("Review submission error:", error);
    return { error: "Failed to submit review" };
  }
}

export async function saveDraftReview(reviewData: {
  projectId: string;
  stage: string;
  score?: number;
  comments?: string;
  decision?: string;
  evaluationData?: any;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user has permission to review
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    const canReview =
      user?.role === "ADMIN" ||
      user?.role === "GATEKEEPER" ||
      user?.role === "REVIEWER";

    if (!canReview) {
      return { error: "You don't have permission to conduct reviews" };
    }

    // Check if review already exists
    const existingReview = await db.gateReview.findFirst({
      where: {
        projectId: reviewData.projectId,
        reviewerId: session.user.id!,
        stage: reviewData.stage as any,
      },
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await db.gateReview.update({
        where: { id: existingReview.id },
        data: {
          score: reviewData.score,
          comments: reviewData.comments,
          decision: reviewData.decision as any,
          isCompleted: false, // Draft, not completed
        },
      });
    } else {
      // Create new draft review
      review = await db.gateReview.create({
        data: {
          projectId: reviewData.projectId,
          reviewerId: session.user.id!,
          stage: reviewData.stage as any,
          score: reviewData.score,
          comments: reviewData.comments,
          decision: reviewData.decision as any,
          isCompleted: false, // Draft, not completed
        },
      });
    }

    // Revalidate relevant paths
    revalidatePath(`/projects/${reviewData.projectId}/review`);
    revalidatePath(`/reviews/${reviewData.projectId}`);

    return { success: true, review };
  } catch (error) {
    console.error("Draft save error:", error);
    return { error: "Failed to save draft" };
  }
}
export async function exportGateReviews(
  filters?: {
    projectId?: string;
    stage?: string;
    reviewerId?: string;
    decision?: string;
    dateFrom?: Date;
    dateTo?: Date;
    isCompleted?: boolean;
  },
  format: "json" | "csv" | "excel" = "csv"
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user has permission to export reviews
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    const canExport =
      user?.role === "ADMIN" ||
      user?.role === "GATEKEEPER" ||
      user?.role === "PROJECT_LEAD";

    if (!canExport) {
      return { error: "You don't have permission to export reviews" };
    }

    // Build where clause based on filters
    const whereClause: any = {};

    if (filters?.projectId) {
      whereClause.projectId = filters.projectId;
    }

    if (filters?.stage) {
      whereClause.stage = filters.stage;
    }

    if (filters?.reviewerId) {
      whereClause.reviewerId = filters.reviewerId;
    }

    if (filters?.decision) {
      whereClause.decision = filters.decision;
    }

    if (filters?.isCompleted !== undefined) {
      whereClause.isCompleted = filters.isCompleted;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.reviewDate = {};
      if (filters.dateFrom) {
        whereClause.reviewDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.reviewDate.lte = filters.dateTo;
      }
    }

    // Fetch gate reviews with related data
    const gateReviews = await db.gateReview.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            projectId: true,
            name: true,
            currentStage: true,
            status: true,
            cluster: {
              select: {
                name: true,
              },
            },
            lead: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: [{ reviewDate: "desc" }, { createdAt: "desc" }],
    });

    if (format === "json") {
      return {
        success: true,
        data: JSON.stringify(gateReviews, null, 2),
        filename: `gate-reviews-export-${new Date().toISOString().split("T")[0]}.json`,
        mimeType: "application/json",
        count: gateReviews.length,
      };
    }

    if (format === "csv") {
      const csvRows = [];

      // CSV Headers
      csvRows.push(
        [
          "Review ID",
          "Project ID",
          "Project Name",
          "Cluster",
          "Project Lead",
          "Project Status",
          "Current Stage",
          "Review Stage",
          "Reviewer Name",
          "Reviewer Email",
          "Reviewer Role",
          "Reviewer Department",
          "Decision",
          "Score",
          "Comments",
          "Review Date",
          "Is Completed",
          "Created At",
          "Updated At",
        ].join(",")
      );

      // CSV Data Rows
      gateReviews.forEach((review: any) => {
        const row = [
          review.id,
          review.project.projectId,
          `"${review.project.name.replace(/"/g, '""')}"`,
          `"${review.project.cluster?.name || "N/A"}"`,
          `"${review.project.lead?.name || "N/A"}"`,
          review.project.status,
          review.project.currentStage,
          review.stage,
          `"${review.reviewer.name || "N/A"}"`,
          review.reviewer.email || "",
          review.reviewer.role,
          `"${review.reviewer.department || "N/A"}"`,
          review.decision || "N/A",
          review.score || "N/A",
          `"${(review.comments || "").replace(/"/g, '""')}"`,
          review.reviewDate?.toISOString() || "N/A",
          review.isCompleted ? "Yes" : "No",
          review.createdAt.toISOString(),
          review.updatedAt.toISOString(),
        ];
        csvRows.push(row.join(","));
      });

      return {
        success: true,
        data: csvRows.join("\n"),
        filename: `gate-reviews-export-${new Date().toISOString().split("T")[0]}.csv`,
        mimeType: "text/csv",
        count: gateReviews.length,
      };
    }

    if (format === "excel") {
      // For Excel format, we'll create a structured data object that can be converted to Excel
      const excelData = {
        worksheets: [
          {
            name: "Gate Reviews",
            data: [
              // Headers
              [
                "Review ID",
                "Project ID",
                "Project Name",
                "Cluster",
                "Project Lead",
                "Project Status",
                "Current Stage",
                "Review Stage",
                "Reviewer Name",
                "Reviewer Email",
                "Reviewer Role",
                "Reviewer Department",
                "Decision",
                "Score",
                "Comments",
                "Review Date",
                "Is Completed",
                "Created At",
                "Updated At",
              ],
              // Data rows
              ...gateReviews.map((review: any) => [
                review.id,
                review.project.projectId,
                review.project.name,
                review.project.cluster?.name || "N/A",
                review.project.lead?.name || "N/A",
                review.project.status,
                review.project.currentStage,
                review.stage,
                review.reviewer.name || "N/A",
                review.reviewer.email || "",
                review.reviewer.role,
                review.reviewer.department || "N/A",
                review.decision || "N/A",
                review.score || "N/A",
                review.comments || "",
                review.reviewDate?.toISOString() || "N/A",
                review.isCompleted ? "Yes" : "No",
                review.createdAt.toISOString(),
                review.updatedAt.toISOString(),
              ]),
            ],
          },
          {
            name: "Summary",
            data: [
              ["Gate Reviews Export Summary"],
              [""],
              ["Total Reviews", gateReviews.length],
              ["Export Date", new Date().toISOString()],
              ["Exported By", user?.name || user?.email || "Unknown"],
              [""],
              ["Filters Applied:"],
              ["Project ID", filters?.projectId || "All"],
              ["Stage", filters?.stage || "All"],
              ["Reviewer ID", filters?.reviewerId || "All"],
              ["Decision", filters?.decision || "All"],
              [
                "Completed Only",
                filters?.isCompleted !== undefined
                  ? filters.isCompleted
                    ? "Yes"
                    : "No"
                  : "All",
              ],
              ["Date From", filters?.dateFrom?.toISOString() || "All"],
              ["Date To", filters?.dateTo?.toISOString() || "All"],
            ],
          },
        ],
      };

      return {
        success: true,
        data: JSON.stringify(excelData, null, 2),
        filename: `gate-reviews-export-${new Date().toISOString().split("T")[0]}.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        count: gateReviews.length,
      };
    }

    return { error: "Invalid export format" };
  } catch (error) {
    console.error("Error exporting gate reviews:", error);
    return { error: "Failed to export gate reviews" };
  }
}

export async function getGateReviewsForExport(filters?: {
  projectId?: string;
  stage?: string;
  reviewerId?: string;
  decision?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isCompleted?: boolean;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user has permission to view reviews
    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    const canView =
      user?.role === "ADMIN" ||
      user?.role === "GATEKEEPER" ||
      user?.role === "PROJECT_LEAD" ||
      user?.role === "REVIEWER";

    if (!canView) {
      return { error: "You don't have permission to view reviews" };
    }

    // Build where clause based on filters
    const whereClause: any = {};

    if (filters?.projectId) {
      whereClause.projectId = filters.projectId;
    }

    if (filters?.stage) {
      whereClause.stage = filters.stage;
    }

    if (filters?.reviewerId) {
      whereClause.reviewerId = filters.reviewerId;
    }

    if (filters?.decision) {
      whereClause.decision = filters.decision;
    }

    if (filters?.isCompleted !== undefined) {
      whereClause.isCompleted = filters.isCompleted;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.reviewDate = {};
      if (filters.dateFrom) {
        whereClause.reviewDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.reviewDate.lte = filters.dateTo;
      }
    }

    // Get summary statistics
    const totalReviews = await db.gateReview.count({ where: whereClause });
    const completedReviews = await db.gateReview.count({
      where: { ...whereClause, isCompleted: true },
    });
    const pendingReviews = await db.gateReview.count({
      where: { ...whereClause, isCompleted: false },
    });

    // Get decision breakdown
    const decisionStats = await db.gateReview.groupBy({
      by: ["decision"],
      where: { ...whereClause, decision: { not: null } },
      _count: true,
    });

    // Get stage breakdown
    const stageStats = await db.gateReview.groupBy({
      by: ["stage"],
      where: whereClause,
      _count: true,
    });

    // Get reviewer breakdown
    const reviewerStats = await db.gateReview.groupBy({
      by: ["reviewerId"],
      where: whereClause,
      _count: true,
    });

    return {
      success: true,
      summary: {
        totalReviews,
        completedReviews,
        pendingReviews,
        completionRate:
          totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0,
      },
      statistics: {
        byDecision: decisionStats,
        byStage: stageStats,
        byReviewer: reviewerStats,
      },
      filters: filters || {},
    };
  } catch (error) {
    console.error("Error getting gate reviews summary:", error);
    return { error: "Failed to get gate reviews summary" };
  }
}
