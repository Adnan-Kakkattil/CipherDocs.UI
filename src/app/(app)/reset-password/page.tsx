"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { graphqlRequest } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";

type ResetPasswordData = {
  resetPassword: {
    token: string;
    user: { id: string; username: string; email: string; isAdmin: boolean };
  };
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();
  const prefilledToken = search.get("token") ?? "";

  const [lucideLoaded, setLucideLoaded] = useState(false);
  const [resetToken, setResetToken] = useState(prefilledToken);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const tokenHint = useMemo(() => {
    if (!resetToken) return "";
    return resetToken.length > 18 ? `${resetToken.slice(0, 10)}…${resetToken.slice(-6)}` : resetToken;
  }, [resetToken]);

  useEffect(() => {
    if (!lucideLoaded) return;
    const w = window as any;
    if (w?.lucide?.createIcons) w.lucide.createIcons();
  }, [lucideLoaded, loading, error, done, tokenHint]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await graphqlRequest<ResetPasswordData>(
        `mutation Reset($resetToken:String!,$newPassword:String!){ resetPassword(resetToken:$resetToken,newPassword:$newPassword){ token user { id username email isAdmin } } }`,
        { resetToken, newPassword }
      );
      setToken(data.resetPassword.token);
      setUser(data.resetPassword.user);
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Script
        src="https://unpkg.com/lucide@latest"
        strategy="afterInteractive"
        onLoad={() => setLucideLoaded(true)}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .bg-orange-gradient {
            background: linear-gradient(135deg, #FF6B00 0%, #FF9E5E 100%);
          }
          .text-orange-primary { color: #FF6B00; }
        `
        }}
      />

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left visual panel */}
        <div className="hidden lg:flex relative overflow-hidden bg-gray-900">
          <div className="absolute inset-0 opacity-35">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 p-12 flex flex-col justify-between w-full text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <i data-lucide="key" className="w-7 h-7 text-white"></i>
              </div>
              <div>
                <div className="text-2xl font-extrabold tracking-tight">
                  Cipher<span className="text-orange-primary">Docs</span>
                </div>
                <div className="text-white/70 text-sm font-medium">Complete your reset</div>
              </div>
            </div>

            <div className="max-w-xl">
              <h1 className="text-4xl font-extrabold leading-tight">Set a new password.</h1>
              <p className="mt-4 text-white/75 text-lg leading-relaxed">
                Provide the reset token and choose a new password. (Lab note: token replay and weak validation are
                intentional.)
              </p>

              <div className="mt-10 grid gap-4">
                <div className="flex items-start gap-3 text-white/90">
                  <div className="mt-1 w-9 h-9 rounded-xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
                    <i data-lucide="bug" className="w-5 h-5 text-orange-300"></i>
                  </div>
                  <div>
                    <div className="font-bold">ATO exercise</div>
                    <div className="text-white/70 text-sm">
                      If you can obtain a victim’s reset token, you can take over the account.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-white/60 text-sm">© {new Date().getFullYear()} CipherDocs</div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center px-6 py-14 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-gradient rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                  <i data-lucide="shield-check" className="text-white w-6 h-6"></i>
                </div>
                <span className="text-2xl font-bold tracking-tight">
                  Cipher<span className="text-orange-primary">Docs</span>
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-200/40 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">New password</h2>
                  <p className="text-gray-500 mt-1">
                    Using token: <span className="font-mono">{tokenHint || "—"}</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-primary">
                  <i data-lucide="rotate-cw" className="w-6 h-6"></i>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Reset token
                  </label>
                  <div className="relative">
                    <i
                      data-lucide="ticket"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    ></i>
                    <input
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="reset_admin_token_123"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <i
                      data-lucide="lock"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    ></i>
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                      placeholder="Choose a new password"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </div>
                ) : null}

                {done ? (
                  <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <div className="font-bold">Password updated</div>
                    <div className="text-xs mt-1 opacity-80">Signing you in…</div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !resetToken || !newPassword}
                  className="w-full py-4 bg-orange-gradient text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <i data-lucide="check" className="w-5 h-5"></i>
                  {loading ? "Updating..." : "Update password"}
                </button>

                <div className="flex items-center justify-between pt-2 text-sm">
                  <a href="/forgot-password" className="font-bold text-orange-primary hover:underline">
                    Request a token
                  </a>
                  <a href="/login" className="font-bold text-gray-500 hover:underline">
                    Back to sign in
                  </a>
                </div>
              </form>
            </div>

            <div className="text-xs text-gray-400 mt-6 text-center">
              Tip: try token <span className="font-mono">reset_admin_token_123</span> after seeding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

