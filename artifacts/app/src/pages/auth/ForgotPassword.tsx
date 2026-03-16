import { useState } from "react";
import { useLocation } from "wouter";
import { useRequestPasswordReset } from "@workspace/api-client-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Shield, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const resetRequest = useRequestPasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetRequest.mutateAsync({ passwordResetRequest: { email } });
    setSubmitted(true);
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-2xl mb-4">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Reset password</h1>
            <p className="text-slate-400 mt-1 text-sm">We'll send you a link to reset your password</p>
          </div>

          {submitted ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Check your email</h3>
              <p className="text-slate-400 text-sm">If an account exists for {email}, you'll receive a reset link shortly.</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetRequest.isPending}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {resetRequest.isPending ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <button
                onClick={() => navigate("/login")}
                className="mt-4 flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
