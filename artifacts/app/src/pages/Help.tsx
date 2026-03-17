import { Link } from "wouter";
import { BookOpen, Settings, Bell, FileText, Smartphone, Users } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections = [
  {
    icon: Settings,
    title: "Setting Up Your Group",
    description: "Creating your group, adding incident types, inviting members, and configuring first responders.",
    articles: [
      {
        title: "Creating a group and starting your free trial",
        content: `To create a group, sign in to your GroupWatch account and click "Create Group" on your dashboard. Give your group a name, select a group type (or leave it as General), and add a short description. Your 1-month free trial begins immediately — no credit card required.

After creating your group, you'll be taken to the Settings page where you can add your logo, contact email, and website. These details appear in your group's public profile and on exported PDFs.`,
      },
      {
        title: "Adding and customising incident types",
        content: `Go to Settings → Incident Types. Click "Add Type", enter a name (e.g. "Suspicious Vehicle"), and optionally assign a colour. Your members will see these categories when filing a report.

You can add as many types as you need, and rename or delete them at any time. Deleting an incident type does not affect reports that were already filed using that type — they retain their original category.`,
      },
      {
        title: "Inviting members by email or share link",
        content: `In Settings → Profile, you'll find your group's unique join link and a printable QR code. Copy the link and share it by email, WhatsApp, or post it on a notice board.

When someone follows the link, they'll be prompted to create a free GroupWatch account and will automatically join your group as a Member. You can then change their role to Responder or Admin from the Members tab.`,
      },
      {
        title: "Setting up responders and permissions",
        content: `In Settings → Members, click the role dropdown next to any member and change it to "Responder" or "Admin".

Responders can view the reports dashboard, claim and action reports, add field notes and photos, escalate reports, and mark reports as resolved. Admins can additionally manage group settings, members, incident types, and billing.

Each responder can enable push notifications from their device to receive instant alerts when new reports are filed.`,
      },
      {
        title: "Drawing map boundaries for your area",
        content: `Go to the Map page (from the left sidebar). Click the polygon tool in the map controls, then click to draw the outline of your area — river stretch, park, estate, or patrol route. Double-click to complete the shape.

Give the boundary a name (e.g. "Upper Beat", "North Car Park"), then click Save. You can draw multiple boundaries and delete or replace them at any time. Map boundaries help you organise reports by location.`,
      },
      {
        title: "Adding escalation contacts",
        content: `Go to Settings → Escalation. Click "Add Contact" and enter the name, organisation, role, phone, and email of the contact — for example, a Garda sergeant, environment agency officer, or county council department.

When a responder escalates a report, they'll see a list of your escalation contacts and can choose who to notify. The contact's name is recorded on the report and included in any exported PDF.`,
      },
    ],
  },
  {
    icon: Bell,
    title: "Responder Guide",
    description: "How to receive, claim, action, and resolve incoming reports.",
    articles: [
      {
        title: "Enabling push notifications on your device",
        content: `After logging in, open the app on your phone. You'll be prompted to allow notifications. Tap Allow to enable push notifications for new reports.

If you missed the prompt, go to your phone's Settings → Notifications → GroupWatch and enable notifications there. On iOS you may need to install the app first (see the PWA installation guide below). On Android, notifications work directly in the browser without installation.`,
      },
      {
        title: "Claiming and actioning a report",
        content: `When a new report is filed, you'll receive a push notification and email with a link. Tap the link to open the report.

On the report page, click "Claim Report" to assign it to yourself. This marks the report as In Progress and lets other responders know someone is handling it. You can then add field notes, photos, or escalate it to an external contact.`,
      },
      {
        title: "Adding field notes and photos",
        content: `On any report you've claimed, scroll to the Updates section. Type your update in the text box — notes, actions taken, or follow-up information. You can also attach additional photos taken in the field.

All updates are timestamped and immutable once saved. They appear in the audit trail on exported PDFs, creating a complete chain-of-evidence record.`,
      },
      {
        title: "Escalating a report to an external contact",
        content: `On a claimed report, click the "Escalate" button. A panel will appear showing your group's saved escalation contacts — Garda sergeants, council officers, agency contacts. Select the contact you're escalating to.

The report status changes to Escalated, the contact's name is recorded on the report, and this appears in the audit trail on any exported PDF. You can still continue adding updates after escalation.`,
      },
      {
        title: "Marking a report as resolved",
        content: `Once the incident has been dealt with, click "Mark as Resolved" on the report. You can add a final resolution note before saving.

The report status changes to Resolved and the resolution timestamp is recorded. The time between claiming and resolving the report is included in your group's analytics as Average Resolution Time.`,
      },
    ],
  },
  {
    icon: BookOpen,
    title: "Submitting Reports",
    description: "For members: how to file a report, attach photos, and use the app offline.",
    articles: [
      {
        title: "Filing your first report",
        content: `Click "New Report" in the sidebar or open the report link your group admin shared with you. Select the incident type from the dropdown, choose the severity level, and describe what you saw.

Your GPS location is captured automatically — or you can drop a pin on the map if you're filing the report after leaving the location. When you're done, tap Submit. Your responders are notified immediately.`,
      },
      {
        title: "Attaching photos and using the camera",
        content: `On the report form, tap the photo attachment area. On a mobile device, you can take a photo directly with your camera or choose an existing photo from your gallery.

Photos are stored at full resolution and their EXIF metadata (including GPS coordinates if your camera records them) is preserved and included in exported PDFs. This is important for legal and evidence purposes.`,
      },
      {
        title: "Submitting a report without internet",
        content: `GroupWatch is a Progressive Web App — it caches the report form and submits it even without a network connection. Complete the form as normal and tap Submit. The report is stored on your device and uploaded automatically the moment connectivity returns.

You'll see a confirmation message that the report has been queued for upload. No data is lost even if you close the browser tab before connectivity returns.`,
      },
      {
        title: "Tracking the status of your reports",
        content: `Go to "My Reports" in the sidebar to see all reports you've submitted, along with their current status: Open, In Progress, Escalated, or Resolved.

Tap any report to see the full detail including any updates added by responders, the audit trail, and the full timeline from submission to resolution.`,
      },
      {
        title: "Using the anonymous reporting option",
        content: `If your group admin has enabled anonymous reporting, you'll see an "Submit Anonymously" checkbox on the report form. When checked, your name is hidden from other members and responders — only the group administrator can see who filed the report.

Anonymous reporting is useful for sensitive incidents. However, note that your account is still required to submit — completely unverified reporting is not supported to prevent spam.`,
      },
    ],
  },
  {
    icon: FileText,
    title: "Exports & Evidence",
    description: "Generating PDFs for court, legal proceedings, and funding applications.",
    articles: [
      {
        title: "Exporting a court-ready individual report PDF",
        content: `Open any report and click the "Print / PDF" button in the top-right corner. A print-optimised page opens showing all report details: incident type, severity, GPS coordinates, timestamp, description, photos, all field updates, and an immutability footer.

Use your browser's Print function (Ctrl+P or Cmd+P) and choose "Save as PDF". The resulting document is suitable for use in legal proceedings, court submissions, and regulatory complaints.`,
      },
      {
        title: "Creating a CSV data export",
        content: `Go to your group's Analytics page and click "Export CSV". This downloads a spreadsheet containing all report data for your group — reference numbers, types, severities, locations, submission times, claim times, resolution times, and statuses.

The CSV is suitable for import into Excel or Google Sheets for further analysis, grant applications, or insurance submissions.`,
      },
      {
        title: "Understanding the immutability footer",
        content: `Every exported PDF includes an immutability footer at the bottom of the page. This states that the report was submitted at a specific timestamp and that the original record cannot be altered after submission.

GroupWatch stores reports in a write-once format — once a report is submitted, its core fields (type, severity, GPS, description, photos) are locked. Any changes appear as timestamped update records in the audit trail, not as modifications to the original. This is by design for evidential integrity.`,
      },
    ],
  },
  {
    icon: Smartphone,
    title: "Offline & PWA",
    description: "Installing the app on your phone and using it without a connection.",
    articles: [
      {
        title: "Installing GroupWatch on Android",
        content: `Open GroupWatch in Chrome on your Android device. Tap the three-dot menu in the top-right corner and select "Add to Home Screen" (or "Install App" if it appears as a banner at the bottom).

Once installed, GroupWatch appears on your home screen as a full-screen app with offline support. Push notifications work on Android without installation, but installing the app gives you faster launch times and a better full-screen experience.`,
      },
      {
        title: "Installing GroupWatch on iPhone",
        content: `Open GroupWatch in Safari on your iPhone (it must be Safari — Chrome on iOS does not support PWA installation). Tap the Share button at the bottom of the screen (the box with an arrow pointing up), then tap "Add to Home Screen".

Once installed, GroupWatch appears on your home screen. Push notifications on iPhone require iOS 16.4 or later. After installation, open the app and allow notifications when prompted.`,
      },
      {
        title: "How offline queuing works",
        content: `When you submit a report without internet, GroupWatch stores the complete report — including photos — in your browser's local storage. You'll see a confirmation that the report has been queued.

When connectivity returns (even briefly), the queued report uploads automatically in the background. You don't need to reopen the app or take any action. If you have multiple queued reports, they all upload in order.`,
      },
      {
        title: "What happens when connectivity returns",
        content: `Queued reports upload automatically as soon as connectivity returns. Once uploaded, they appear in the group dashboard immediately and responders are notified.

The report's submission timestamp reflects the original time you submitted it offline — not the upload time. This preserves the accuracy of your incident timeline and is important for evidential purposes.`,
      },
    ],
  },
  {
    icon: Users,
    title: "Billing & Account",
    description: "Managing your subscription, upgrading plans, and account settings.",
    articles: [
      {
        title: "Understanding the free trial",
        content: `Every new group gets a 1-month free trial with full access to all features — no credit card required. You can invite unlimited members, file unlimited reports, and use every feature without restriction during the trial.

At the end of your trial, you'll be prompted to add a payment method to continue. Your data is not deleted if your trial expires — it's retained for 30 days to give you time to subscribe.`,
      },
      {
        title: "Upgrading from monthly to annual",
        content: `Go to Settings → Billing. If you're on the monthly plan (€20/month), you'll see an option to switch to the annual plan (€200/year — equivalent to 2 months free). Click "Switch to Annual" and confirm.

The switch takes effect immediately. You'll be charged the annual amount and your billing date resets to today. Any remaining credit from your current monthly period is applied as a credit on your annual invoice.`,
      },
      {
        title: "Cancelling your subscription",
        content: `Go to Settings → Billing and click "Manage Subscription". You can cancel at any time. Your access continues until the end of your current billing period — there are no partial refunds.

After cancellation, your group and all its data remain accessible in a read-only state for 30 days. After 30 days, data is scheduled for deletion. If you wish to export your data before deletion, use the CSV export and individual PDF exports.`,
      },
      {
        title: "Requesting a data export or deletion",
        content: `To export all your group's data, use the CSV export from the Analytics page and PDF exports for individual reports. These give you a complete copy of your incident records.

To request full data deletion, contact us at the address on the Contact page. We'll process your request within 30 days in line with GDPR requirements and confirm deletion by email.`,
      },
    ],
  },
];

export default function Help() {
  return (
    <PublicLayout>
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
              Help Centre
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
              How can we help?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Guides for admins, responders, and members — from first setup to exporting a court-ready PDF.
            </p>
          </div>

          <div className="space-y-10">
            {sections.map(({ icon: Icon, title, description, articles }) => (
              <div key={title} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-start gap-4 p-6 border-b border-border">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                  </div>
                </div>
                <Accordion type="multiple" className="px-6">
                  {articles.map((article) => (
                    <AccordionItem key={article.title} value={article.title}>
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:text-accent hover:no-underline py-4">
                        {article.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pb-4 space-y-3">
                          {article.content.split("\n\n").map((para, i) => (
                            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                              {para}
                            </p>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-muted/50 border border-border rounded-2xl p-8 text-center">
            <h3 className="font-semibold text-foreground mb-2">Can't find what you need?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Send us an email and we'll get back to you within one business day.
            </p>
            <Link href="/contact">
              <span className="text-sm font-medium text-accent hover:underline">Contact us →</span>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
