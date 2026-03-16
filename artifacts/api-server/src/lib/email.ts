import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@incidentiq.io";
const APP_NAME = "IncidentIQ";
const APP_URL = process.env.APP_URL || "https://incidentiq.io";

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!process.env.SMTP_USER) return; // Skip in dev if not configured

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: `Welcome to ${APP_NAME}, ${name}!`,
    html: `
      <h2>Welcome to ${APP_NAME}</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created. You're ready to start reporting incidents and keeping your community safe.</p>
      <p><a href="${APP_URL}/dashboard">Go to your dashboard →</a></p>
      <p>The ${APP_NAME} team</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  if (!process.env.SMTP_USER) return;

  const resetUrl = `${APP_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <h2>Password Reset</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset my password →</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>The ${APP_NAME} team</p>
    `,
  });
}

export async function sendTrialExpiryReminderEmail(email: string, groupName: string, daysLeft: number): Promise<void> {
  if (!process.env.SMTP_USER) return;

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: `Your ${APP_NAME} trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    html: `
      <h2>Your free trial is ending soon</h2>
      <p>Your trial for <strong>${groupName}</strong> ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.</p>
      <p>Subscribe now to keep your incident reporting running without interruption.</p>
      <p><a href="${APP_URL}/dashboard">Subscribe →</a></p>
      <p>Plans start at €20/month or €200/year (saves 2 months).</p>
      <p>The ${APP_NAME} team</p>
    `,
  });
}

export async function sendMemberInviteEmail(
  email: string,
  groupName: string,
  inviterName: string,
  inviteUrl: string
): Promise<void> {
  if (!process.env.SMTP_USER) return;

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: `You've been invited to join ${groupName} on ${APP_NAME}`,
    html: `
      <h2>You're invited</h2>
      <p>${inviterName} has invited you to join <strong>${groupName}</strong> on ${APP_NAME}.</p>
      <p><a href="${inviteUrl}">Accept invitation →</a></p>
      <p>This invitation expires in 7 days.</p>
      <p>The ${APP_NAME} team</p>
    `,
  });
}
