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

const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@groupwatchplatform.com";
const APP_NAME = "GroupWatch";
const APP_URL = process.env.APP_URL || "https://groupwatchplatform.com";

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

const GROUP_TYPE_PARAGRAPHS: Record<string, string> = {
  tidy_towns:
    "Document dumping, graffiti, and environmental issues as they happen. Build an evidence record you can present directly to your council.",
  neighbourhood_watch:
    "Log suspicious activity, share updates with your responder network, and keep a timestamped record for Garda liaison meetings.",
  hoa:
    "Give residents a simple way to report maintenance issues, anti-social behaviour, and safety concerns — all tracked in one place.",
  angling_club:
    "Give your members and the public a direct line to your waterkeepers — reports come in instantly, with photos and GPS location. Add a report button to your club website or social media, share the link on WhatsApp, and manage everything from one simple dashboard.",
  sports_club:
    "Report vandalism, equipment theft, and grounds issues the moment they happen, with photo evidence and an automatic audit trail.",
  environmental:
    "Log damage, theft, and safety hazards with photos and location — and keep your whole committee informed automatically.",
  other:
    "Keep every community incident in one place with photo evidence, timestamps, and automatic audit trails — so nothing gets lost.",
};

export async function sendOutreachInvitationEmail(
  email: string,
  groupName: string,
  groupType: string,
  claimUrl: string,
  pixelUrl: string
): Promise<void> {
  if (!process.env.SMTP_USER) return;

  const typeParagraph =
    GROUP_TYPE_PARAGRAPHS[groupType] ?? GROUP_TYPE_PARAGRAPHS.other;

  const subject = `An invitation for ${groupName} — 6 months free`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 16px;">
      <p style="margin:0 0 20px;">
        Hi, my name is Patrick Ryan, and I've developed a platform specifically for angling clubs,
        societies and organisations. GroupWatch gives your waterkeepers real-time
        visibility over what's happening on your waters — illegal fishing, poaching, pollution,
        and other incidents — reported directly by your members and the public the moment they
        see something.
      </p>

      <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#111;">
        Stop chasing reports across WhatsApp and paper — manage everything in one place.
      </p>

      <p style="margin:0 0 20px;">${typeParagraph}</p>

      <p style="margin:0 0 20px;">
        GroupWatch is already being used by community groups to protect their waters and manage incidents in real time.
      </p>

      <p style="margin:0 0 24px;">
        We'd like to invite <strong>${groupName}</strong> to join them free for
        6 months — no credit card, no commitment.
      </p>

      <a href="${claimUrl}"
         style="display:inline-block;background:#10b981;color:#ffffff;padding:14px 28px;
                text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
        Claim your 6 months free →
      </a>

      <p style="margin:32px 0 0;color:#555;font-size:14px;">The GroupWatch Team</p>
      <img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;" />
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject,
    html,
  });
}

export async function sendReportNotificationEmail(
  email: string,
  responderName: string,
  groupName: string,
  referenceNumber: string,
  incidentTypeName: string,
  severity: string,
  reportUrl: string
): Promise<void> {
  if (!process.env.SMTP_USER) return;

  const severityColour = severity === "emergency" ? "#dc2626" : severity === "high" ? "#ea580c" : severity === "medium" ? "#ca8a04" : "#2563eb";

  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM_ADDRESS}>`,
    to: email,
    subject: `[${severity.toUpperCase()}] New incident report for ${groupName} — ${referenceNumber}`,
    html: `
      <h2>New Incident Report</h2>
      <p>Hi ${responderName},</p>
      <p>A new incident has been reported to <strong>${groupName}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;max-width:480px;margin:16px 0;">
        <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;">Reference</td><td style="padding:8px;">${referenceNumber}</td></tr>
        <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;">Type</td><td style="padding:8px;">${incidentTypeName}</td></tr>
        <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold;">Severity</td><td style="padding:8px;"><span style="color:${severityColour};font-weight:bold;">${severity.toUpperCase()}</span></td></tr>
      </table>
      <p><a href="${reportUrl}" style="display:inline-block;background:#10b981;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">View Report →</a></p>
      <p>The ${APP_NAME} team</p>
    `,
  });
}
