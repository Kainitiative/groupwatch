import PublicLayout from "@/components/layout/PublicLayout";

export default function Legal() {
  return (
    <PublicLayout>
      <section className="py-20 md:py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Privacy Policy & Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated: March 2026</p>

          {/* Privacy Policy */}
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Privacy Policy</h2>

              <h3 className="text-base font-semibold text-foreground mb-2">1. Who we are</h3>
              <p className="leading-relaxed">
                IncidentIQ is a Software-as-a-Service platform operated from Ireland. We provide incident reporting tools to organised groups including clubs, neighbourhood associations, and community organisations. References to "we", "us", or "our" mean the operator of IncidentIQ.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">2. What data we collect</h3>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li><strong className="text-foreground">Account data:</strong> Name, email address, and hashed password on registration.</li>
                <li><strong className="text-foreground">Incident reports:</strong> Location (GPS coordinates), incident type, severity, description, and photos submitted by your group members.</li>
                <li><strong className="text-foreground">Photo metadata:</strong> EXIF data including GPS coordinates and capture timestamp is extracted from uploaded photos.</li>
                <li><strong className="text-foreground">Device push tokens:</strong> If you opt in to push notifications, we store a device-specific push endpoint. This is not tied to a physical device identifier.</li>
                <li><strong className="text-foreground">Billing data:</strong> Payment processing is handled entirely by Stripe. We store only your Stripe customer ID and subscription status — no card numbers or payment details.</li>
                <li><strong className="text-foreground">Usage data:</strong> Standard server logs (IP address, request path, timestamps) for security and debugging purposes. Retained for 30 days.</li>
              </ul>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">3. How we use your data</h3>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>To operate the platform and provide the service your group has subscribed to.</li>
                <li>To send transactional emails (report notifications, account creation, password reset, trial reminders).</li>
                <li>To send push notifications to opted-in devices when reports are filed.</li>
                <li>To process subscription payments through Stripe.</li>
                <li>We do not sell your data. We do not use it for advertising.</li>
              </ul>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">4. Data storage and retention</h3>
              <p className="leading-relaxed">
                Data is stored on servers located in the European Union. Incident report data is retained for as long as the group's subscription is active. If a subscription lapses and is not renewed within 90 days, data may be permanently deleted following prior email notice.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">5. Your rights (GDPR)</h3>
              <p className="leading-relaxed">
                You have the right to access, correct, or delete your personal data. You may request a data export or deletion by emailing <a href="mailto:hello@incidentiq.ie" className="text-accent hover:underline">hello@incidentiq.ie</a>. We will respond within 30 days.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">6. Third-party services</h3>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li><strong className="text-foreground">Stripe</strong> — payment processing. Subject to Stripe's own privacy policy.</li>
                <li><strong className="text-foreground">Web Push (VAPID)</strong> — delivered via browser push infrastructure (Google FCM for Chrome, Mozilla for Firefox, Apple for Safari). Push tokens are device-specific and not shared with third parties.</li>
              </ul>
            </section>

            <hr className="border-border" />

            {/* Terms */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Terms of Service</h2>

              <h3 className="text-base font-semibold text-foreground mb-2">1. Acceptance</h3>
              <p className="leading-relaxed">
                By registering a group on IncidentIQ you agree to these terms. The group administrator accepts these terms on behalf of the group and its members.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">2. Permitted use</h3>
              <p className="leading-relaxed">
                IncidentIQ is provided for legitimate incident reporting by organised groups. You must not use the platform to file false reports, harass individuals, or for any unlawful purpose.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">3. Subscription and billing</h3>
              <p className="leading-relaxed">
                Subscriptions are €20/month or €200/year, billed in Euro. A 1-month free trial is available with no credit card required. Subscriptions renew automatically. You may cancel at any time; access continues until the end of the current billing period.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">4. Immutability of records</h3>
              <p className="leading-relaxed">
                Incident report submissions are permanently locked on creation. This is a deliberate design decision to preserve the evidentiary integrity of the record. Administrators may append updates and notes to the audit trail but cannot alter the original submission.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">5. Anonymous reporting</h3>
              <p className="leading-relaxed">
                If your group enables anonymous reporting, the reporter's identity is hidden from other members and responders. It remains visible to the group administrator for legal compliance purposes. We recommend seeking legal advice before enabling this feature.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">6. Limitation of liability</h3>
              <p className="leading-relaxed">
                IncidentIQ is a reporting tool. We make no warranty that use of the platform will lead to any particular outcome in legal, regulatory, or enforcement proceedings. The platform is provided as-is. Our liability is limited to the amount paid for the subscription in the preceding 12 months.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">7. Changes to these terms</h3>
              <p className="leading-relaxed">
                We may update these terms from time to time. Significant changes will be communicated by email to the group administrator at least 14 days in advance.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">8. Governing law</h3>
              <p className="leading-relaxed">
                These terms are governed by the laws of Ireland. Any disputes shall be subject to the exclusive jurisdiction of the Irish courts.
              </p>

              <h3 className="text-base font-semibold text-foreground mt-6 mb-2">9. Contact</h3>
              <p className="leading-relaxed">
                Questions about these terms: <a href="mailto:hello@incidentiq.ie" className="text-accent hover:underline">hello@incidentiq.ie</a>
              </p>
            </section>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
