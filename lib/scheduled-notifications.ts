import { db } from "@/lib/db";
import { sendMilestoneReminderNotification } from "@/lib/notifications";

export async function sendMilestoneReminders() {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Get milestones due within 3 days that are not completed
    const upcomingMilestones = await db.milestone.findMany({
      where: {
        isCompleted: false,
        dueDate: {
          lte: threeDaysFromNow,
          gte: now,
        },
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
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    for (const milestone of upcomingMilestones) {
      const projectUrl = `${baseUrl}/projects/${milestone.projectId}`;
      const daysUntilDue = Math.ceil(
        (milestone.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const recipients = [
        { id: milestone.project.leadId, email: milestone.project.lead.email },
        ...milestone.project.members.map((m: any) => ({
          id: m.userId,
          email: m.user.email,
        })),
      ].filter((r) => r.email) as { id: string; email: string }[];

      if (recipients.length > 0) {
        await sendMilestoneReminderNotification(
          {
            projectName: milestone.project.name,
            projectId: milestone.project.projectId,
            milestoneName: milestone.title,
            dueDate: milestone.dueDate.toLocaleDateString(),
            daysUntilDue,
            projectUrl,
          },
          recipients
        );
      }
    }

    console.log(
      `Sent milestone reminders for ${upcomingMilestones.length} milestones`
    );
  } catch (error) {
    console.error("Error sending milestone reminders:", error);
  }
}

export async function sendWeeklyDigest() {
  try {
    // Get all users who have weekly digest enabled
    const usersWithDigest = await (db as any).user.findMany({
      where: {
        email: { not: null },
        notificationPreference: {
          weeklyDigest: true,
          emailNotifications: true,
        },
      },
      include: {
        projectsLed: {
          include: {
            gateReviews: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            },
            redFlags: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
            documents: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
        projectMembers: {
          include: {
            project: {
              include: {
                gateReviews: {
                  where: {
                    createdAt: {
                      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
                redFlags: {
                  where: {
                    createdAt: {
                      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
                documents: {
                  where: {
                    createdAt: {
                      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // TODO: Implement weekly digest email template and sending logic
    // This would aggregate all activities for each user's projects and send a summary

    console.log(`Would send weekly digest to ${usersWithDigest.length} users`);
  } catch (error) {
    console.error("Error sending weekly digest:", error);
  }
}
