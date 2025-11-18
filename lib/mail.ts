import { Resend } from "resend";
import { VerificationEmail } from "@/emails/verification-email";
import { ProjectNotificationEmail } from "@/emails/project-notification";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL;

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  await resend.emails.send({
    from: "CSIR Stage-Gate <onboarding@resend.dev>",
    to: email,
    subject: "Confirm your email - CSIR Stage-Gate Platform",
    react: VerificationEmail({ confirmLink }),
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/auth/new-password?token=${token}`;

  await resend.emails.send({
    from: "CSIR Stage-Gate <onboarding@resend.dev>",
    to: email,
    subject: "Reset your password - CSIR Stage-Gate Platform",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://www.csir.co.za/sites/all/themes/csir/logo.png" alt="CSIR" style="height: 50px; margin-bottom: 20px;">
        <h2>Reset Your Password</h2>
        <p>You requested to reset your password for the CSIR Stage-Gate Platform.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #005b9f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">CSIR Stage-Gate Platform - Research & Development Management System</p>
      </div>
    `,
  });
};

export const sendProjectNotification = async (
  email: string,
  recipientName: string,
  projectName: string,
  projectId: string,
  action: string,
  details: string,
  projectUrl: string
) => {
  await resend.emails.send({
    from: "CSIR Stage-Gate <notifications@resend.dev>",
    to: email,
    subject: `${action} - ${projectName}`,
    react: ProjectNotificationEmail({
      projectName,
      projectId,
      action,
      details,
      actionUrl: projectUrl,
      recipientName,
    }),
  });
};
