"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { graphqlRequest } from "@/lib/api";

type RequestResetData = {
  requestPasswordReset: {
    ok: boolean;
    message: string;
    resetToken?: string | null;
  };
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [lucideLoaded, setLucideLoaded] = useState(false);

  const [identifier, setIdentifier] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string; resetToken?: string | null } | null>(
    null
  );

  const resetLink = useMemo(() => {
    const t = result?.resetToken ? String(result.resetToken) : "";
    if (!t) return "";
    return `/reset-password?token=${encodeURIComponent(t)}`;
  }, [result?.resetToken]);

  useEffect(() => {
    if (!lucideLoaded) return;
    const w = window as any;
    if (w?.lucide?.createIcons) w.lucide.createIcons();
  }, [lucideLoaded, loading, error, result?.resetToken]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await graphqlRequest<RequestResetData>(
        `mutation RequestReset($identifier:String!){ requestPasswordReset(identifier:$identifier){ ok message resetToken } }`,
        { identifier }
      );
      setResult(data.requestPasswordReset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
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
        <div className="hidden lg:flex relative overflow-hidden bg-orange-gradient">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 p-12 flex flex-col justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center ring-1 ring-white/25">
                <i data-lucide="key-round" className="w-7 h-7 text-white"></i>
              </div>
              <div className="text-white">
                <div className="text-2xl font-extrabold tracking-tight">
                  Cipher<span className="text-white/80">Docs</span>
                </div>
                <div className="text-white/80 text-sm font-medium">Recover access to your workspace</div>
              </div>
            </div>

            <div className="max-w-xl">
              <h1 className="text-4xl font-extrabold text-white leading-tight">Forgot your password?</h1>
              <p className="mt-4 text-white/85 text-lg leading-relaxed">
                Enter your email or username to request a reset. (Lab note: this demo returns the reset token
                directly.)
              </p>

              <div className="mt-10 grid gap-4">
                <div className="flex items-start gap-3 text-white/90">
                  <div className="mt-1 w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                    <i data-lucide="shield-alert" className="w-5 h-5 text-white"></i>
                  </div>
                  <div>
                    <div className="font-bold">Security training</div>
                    <div className="text-white/80 text-sm">
                      This flow is intentionally vulnerable for account takeover exercises.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-white/75 text-sm">© {new Date().getFullYear()} CipherDocs</div>
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
                  <h2 className="text-2xl font-extrabold text-gray-900">Reset access</h2>
                  <p className="text-gray-500 mt-1">Request a password reset token.</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-primary">
                  <i data-lucide="mail-question" className="w-6 h-6"></i>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Email or username
                  </label>
                  <div className="relative">
                    <i
                      data-lucide="user"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    ></i>
                    <input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      placeholder="admin or admin@cipherdocs.local"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </div>
                ) : null}

                {result ? (
                  <div
                    className={`text-sm rounded-xl px-4 py-3 border ${
                      result.ok ? "text-green-700 bg-green-50 border-green-100" : "text-red-700 bg-red-50 border-red-100"
                    }`}
                  >
                    <div className="font-bold">{result.ok ? "Request created" : "Request failed"}</div>
                    <div className="mt-1 text-xs opacity-80">{result.message}</div>
                    {result.resetToken ? (
                      <div className="mt-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                          Reset token (vulnerable)
                        </div>
                        <div className="font-mono text-xs break-all bg-white/60 border border-white rounded-lg p-3">
                          {String(result.resetToken)}
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push(resetLink)}
                          className="mt-3 w-full py-3 bg-white border border-orange-200 text-orange-primary rounded-xl font-bold shadow-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <i data-lucide="arrow-right" className="w-4 h-4"></i> Continue to reset
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-orange-gradient text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <i data-lucide="send" className="w-5 h-5"></i>
                  {loading ? "Requesting..." : "Send reset token"}
                </button>

                <div className="flex items-center justify-between pt-2 text-sm">
                  <a href="/login" className="font-bold text-orange-primary hover:underline">
                    Back to sign in
                  </a>
                  <a href="/register" className="font-bold text-gray-500 hover:underline">
                    Create account
                  </a>
                </div>
              </form>
            </div>

            <div className="text-xs text-gray-400 mt-6 text-center">
              Tip: Try requesting a reset for <span className="font-mono">admin</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

