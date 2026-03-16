import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useConfirmPasswordReset } from "@workspace/api-client-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Shield, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [, params] = useRoute("/reset-password/:token");
  const [, navigate] = useLocation();
  const token = params?.token ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const confirmReset = useConfirmPasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password !== confirm) { setErr("Passwords do not match"); return; }
    if (password.length < 8) { setErr("Password must be at least 8 characters"); return; }

    try {
      await confirmReset.mutateAsync({ passwordResetConfirm: { token, password } });
      setDone(true);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "This reset link has expired or is invalid");
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-2xl mb-4">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Set new password</h1>
          </div>

          {done ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Password updated</h3>
              <p className="text-slate-400 text-sm mb-4">You can now sign in with your new password.</p>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
              >
                Sign in
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm password</label>
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {err && <p className="text-red-400 text-sm bg-red-950/30 rounded-lg px-3 py-2">{err}</p>}
                <button
                  type="submit"
                  disabled={confirmReset.isPending}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {confirmReset.isPending ? "Updating..." : "Update password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
