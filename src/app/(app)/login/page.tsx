"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { graphqlRequest } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import Script from "next/script";
import { useEffect } from "react";

type LoginData = {
  login: {
    token: string;
    user: { id: string; username: string; email: string; isAdmin: boolean };
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lucideLoaded, setLucideLoaded] = useState(false);

  useEffect(() => {
    if (!lucideLoaded) return;
    const w = window as any;
    if (w?.lucide?.createIcons) w.lucide.createIcons();
  }, [lucideLoaded]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await graphqlRequest<LoginData>(
        `mutation Login($username:String!,$password:String!){ login(username:$username,password:$password){ token user { id username email isAdmin } } }`,
        { username, password }
      );
      setToken(data.login.token);
      setUser(data.login.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
                <i data-lucide="shield-check" className="w-7 h-7 text-white"></i>
              </div>
              <div className="text-white">
                <div className="text-2xl font-extrabold tracking-tight">
                  Cipher<span className="text-white/80">Docs</span>
                </div>
                <div className="text-white/80 text-sm font-medium">Secure document storage for the future</div>
              </div>
            </div>

            <div className="max-w-xl">
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                Welcome back to your workspace.
              </h1>
              <p className="mt-4 text-white/85 text-lg leading-relaxed">
                Upload, manage, and collaborate on documents with a high‑performance GraphQL backend.
              </p>

              <div className="mt-10 grid gap-4">
                <div className="flex items-start gap-3 text-white/90">
                  <div className="mt-1 w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                    <i data-lucide="zap" className="w-5 h-5 text-white"></i>
                  </div>
                  <div>
                    <div className="font-bold">Fast access</div>
                    <div className="text-white/80 text-sm">Search and open docs in seconds.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-white/90">
                  <div className="mt-1 w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                    <i data-lucide="file-text" className="w-5 h-5 text-white"></i>
                  </div>
                  <div>
                    <div className="font-bold">Document vault</div>
                    <div className="text-white/80 text-sm">Organize by category and classification.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-white/90">
                  <div className="mt-1 w-9 h-9 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                    <i data-lucide="message-square" className="w-5 h-5 text-white"></i>
                  </div>
                  <div>
                    <div className="font-bold">Team comments</div>
                    <div className="text-white/80 text-sm">Keep review notes next to the file.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-white/75 text-sm">
              © {new Date().getFullYear()} CipherDocs
            </div>
          </div>
        </div>

        {/* Right login panel */}
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
                  <h2 className="text-2xl font-extrabold text-gray-900">Sign in</h2>
                  <p className="text-gray-500 mt-1">Access your documents and activity.</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-primary">
                  <i data-lucide="log-in" className="w-6 h-6"></i>
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
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      placeholder="admin or admin@cipherdocs.local"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <i
                      data-lucide="lock"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    ></i>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-orange-gradient text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <i data-lucide="shield" className="w-5 h-5"></i>
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <div className="flex items-center justify-between pt-2 text-sm">
                  <a href="/register" className="font-bold text-orange-primary hover:underline">
                    Create account
                  </a>
                </div>
              </form>
            </div>

            <div className="text-xs text-gray-400 mt-6 text-center">
              Tip: you can sign in using either username or email.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

