"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { apiRequest } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { getToken, getUser, signOut } from "@/lib/auth";

type Doc = {
  id: number;
  uuid: string;
  title: string;
  status: string;
  ownerId: string;
  filename: string;
  fileSize: number;
  filePath: string;
  category: string;
  classification: string;
  createdAt?: string;
};

type Comment = {
  id: string;
  documentId: number;
  authorId: string;
  body: string;
  createdAt?: string;
};

function initials(usernameOrEmail: string) {
  const s = (usernameOrEmail || "").trim();
  if (!s) return "U";
  const base = s.includes("@") ? s.split("@")[0] : s;
  const parts = base.split(/[._\s-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
  return (letters.join("") || base.slice(0, 2).toUpperCase()).slice(0, 2);
}

function categoryBadge(category: string) {
  const c = (category || "general").toLowerCase();
  if (c === "finance") return "bg-blue-50 text-blue-600";
  if (c === "hr") return "bg-purple-50 text-purple-600";
  if (c === "security") return "bg-red-50 text-red-600";
  return "bg-gray-50 text-gray-600";
}

function securityBadge(classification: string) {
  const cl = (classification || "internal").toLowerCase();
  if (cl === "confidential") return { label: "Encrypted", cls: "bg-green-50 text-green-600" };
  if (cl === "restricted") return { label: "Restricted", cls: "bg-red-50 text-red-600" };
  return { label: "Internal", cls: "bg-orange-50 text-orange-600" };
}

export default function DocumentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const token = useMemo(() => getToken(), []);
  const me = useMemo(() => getUser(), []);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lucideLoaded, setLucideLoaded] = useState(false);

  useEffect(() => {
    if (!token || !me) router.push("/login");
  }, [token, me, router]);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const d = await apiRequest<Doc>(`${API_BASE}/documents/${id}`, { token });
      const c = await apiRequest<{ comments: Comment[] }>(`${API_BASE}/documents/${id}/comments`, { token });
      setDoc(d);
      setComments(c.comments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    if (!lucideLoaded) return;
    const w = window as any;
    if (w?.lucide?.createIcons) w.lucide.createIcons();
  }, [lucideLoaded, loading, error, comments.length, doc?.id]);

  async function onAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await apiRequest(`${API_BASE}/documents/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
        token
      });
      setCommentBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    }
  }

  async function onDelete() {
    if (!token) return;
    try {
      await apiRequest(`${API_BASE}/documents/${id}/delete`, { method: "POST", token });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function onDownload() {
    if (!token || !doc) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  const profileName = me?.username ?? "user";
  const profileTier = me?.isAdmin ? "Admin" : "Pro Account";
  const profileInitials = initials(me?.username || me?.email || "user");

  const sec = securityBadge(doc?.classification ?? "internal");

  return (
    <div className="text-gray-900" style={{ backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
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
          .bg-orange-primary { background-color: #FF6B00; }
        `
        }}
      />

      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <button
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/dashboard")}
              type="button"
            >
              <div className="w-10 h-10 bg-orange-gradient rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <i data-lucide="shield-check" className="text-white w-6 h-6"></i>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Cipher<span className="text-orange-primary">Docs</span>
              </span>
            </button>

            <div className="hidden md:flex items-center space-x-8 font-medium text-gray-600">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="text-orange-primary flex items-center gap-2"
              >
                <i data-lucide="layout-grid" className="w-4 h-4"></i> Overview
              </button>
              <a href="#" className="hover:text-orange-primary transition-colors flex items-center gap-2">
                <i data-lucide="folder" className="w-4 h-4"></i> Projects
              </a>
              <a href="#" className="hover:text-orange-primary transition-colors flex items-center gap-2">
                <i data-lucide="settings" className="w-4 h-4"></i> Settings
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{profileName}</p>
                  <p className="text-xs text-gray-500">{profileTier}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center text-orange-primary font-bold">
                  {profileInitials}
                </div>
              </div>
              <button
                className="p-2 text-gray-400 hover:text-orange-primary transition-colors"
                onClick={() => {
                  signOut();
                  router.push("/login");
                }}
                type="button"
                aria-label="Sign out"
              >
                <i data-lucide="log-out" className="w-5 h-5"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-orange-primary font-bold text-sm mb-2 px-3 py-1 rounded-full bg-orange-50 w-fit">
                <i data-lucide="file-text" className="w-4 h-4"></i> Document Details
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {doc ? doc.title : `Document #${id}`}
              </h1>
              <p className="text-gray-500 mt-1 italic">
                View metadata, download the file, and collaborate with comments.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                type="button"
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <i data-lucide="arrow-left" className="w-4 h-4"></i> Back
              </button>
              <button
                onClick={onDownload}
                type="button"
                disabled={!doc}
                className="px-5 py-2.5 bg-orange-primary text-white rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <i data-lucide="download" className="w-4 h-4"></i> Download
              </button>
              <button
                onClick={onDelete}
                type="button"
                disabled={!doc}
                className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-semibold shadow-sm hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <i data-lucide="trash-2" className="w-4 h-4"></i> Delete
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-10 text-gray-400">
              Loading document...
            </div>
          ) : error ? (
            <div className="bg-white rounded-[2rem] border border-red-100 shadow-xl shadow-gray-200/40 p-6 text-red-700">
              {error}
            </div>
          ) : !doc ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-10 text-gray-400">
              Document not found.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-primary">
                        <i data-lucide="file" className="w-5 h-5"></i>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{doc.filename}</div>
                        <div className="text-xs text-gray-400 font-mono">#{String(doc.id).padStart(4, "0")}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${categoryBadge(
                          doc.category
                        )}`}
                      >
                        {doc.category}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${sec.cls}`}
                      >
                        {sec.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                          Owner ID
                        </div>
                        <div className="text-sm font-mono text-gray-700 break-all">{doc.ownerId}</div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                          UUID
                        </div>
                        <div className="text-sm font-mono text-gray-700 break-all">{doc.uuid}</div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 md:col-span-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                          Storage path
                        </div>
                        <div className="text-sm font-mono text-gray-700 break-all">{doc.filePath}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <i data-lucide="message-square" className="w-4 h-4 text-orange-primary"></i> Comments
                    </h3>
                    <div className="text-xs text-gray-400">{comments.length} total</div>
                  </div>

                  <div className="p-6 space-y-3">
                    {comments.length ? (
                      comments.map((c) => (
                        <div key={c.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                          <div className="text-xs text-gray-400 font-mono mb-2">{c.authorId}</div>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap">{c.body}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm">No comments yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-8">
                  <div className="flex items-center gap-2 mb-6 text-orange-primary font-bold text-sm uppercase tracking-widest">
                    <i data-lucide="plus-circle" className="w-5 h-5"></i> Add Comment
                  </div>

                  <form onSubmit={onAddComment} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                        Comment
                      </label>
                      <textarea
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Write a note for your team..."
                        className="w-full min-h-[120px] px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4 bg-orange-gradient text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <i data-lucide="send" className="w-5 h-5"></i>
                      Post Comment
                    </button>
                    <div className="text-xs text-gray-400">
                      Tip: Use comments to capture review notes, decisions, and next steps.
                    </div>
                  </form>
                </div>

                <div className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-orange-primary">
                      <i data-lucide="shield-check" className="w-4 h-4"></i> Security Status
                    </h4>
                    <div className="text-sm text-gray-200 mb-2">
                      Classification: <span className="font-bold">{doc.classification}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono break-all">
                      File: {doc.filename}
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-bold hover:bg-white hover:text-gray-900 transition-all uppercase tracking-widest"
                      >
                        Back to workspace
                      </button>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-primary/10 rounded-full blur-2xl group-hover:bg-orange-primary/20 transition-all"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

