import { Mail, Clock } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";

export default function Contact() {
  return (
    <PublicLayout>
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
            Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            We're here to help.
          </h1>
          <p className="text-lg text-muted-foreground mb-16">
            Got a question about setting up your group, a billing query, or a feature you'd like to see? Reach out and we'll get back to you promptly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Email</h3>
              <a
                href="mailto:hello@groupwatch.io"
                className="text-accent hover:underline text-sm font-medium"
              >
                hello@groupwatch.io
              </a>
              <p className="text-xs text-muted-foreground mt-2">For all general and billing enquiries</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We aim to respond to all queries within one business day.
              </p>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-2xl p-8 text-left">
            <h3 className="font-semibold text-foreground mb-4">Before you write — check the Help Centre</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Most setup questions are covered in our Help Centre — from adding your first incident type to exporting a court-ready PDF.
            </p>
            <a href="/help" className="text-sm font-medium text-accent hover:underline">
              Browse the Help Centre →
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
