"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { graphqlRequest, apiRequest } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { getToken, getUser, signOut } from "@/lib/auth";

type Doc = {
  id: number;
  title: string;
  ownerId: string;
  filename: string;
  category: string;
  classification: string;
  createdAt?: string | null;
};

type DocumentsData = {
  documents: Doc[];
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

export default function DashboardPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);
  const me = useMemo(() => getUser(), []);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const [lucideLoaded, setLucideLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [classification, setClassification] = useState("internal");
  const [file, setFile] = useState<File | null>(null);
  const [fileLabel, setFileLabel] = useState("Select or Drag File");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token || !me) router.push("/login");
  }, [token, me, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlRequest<DocumentsData>(
          `query { documents { id title ownerId filename category classification createdAt } }`
        );
        if (!cancelled) setDocs(data.documents);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleDocs = useMemo(() => {
    if (!me) return docs;
    const base = showAll ? docs : docs.filter((d) => d.ownerId === me.id);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((d) => {
      return (
        d.title.toLowerCase().includes(q) ||
        d.filename.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.classification.toLowerCase().includes(q) ||
        String(d.id).includes(q)
      );
    });
  }, [docs, showAll, me]);

  useEffect(() => {
    if (!lucideLoaded) return;
    const w = window as any;
    if (w?.lucide?.createIcons) w.lucide.createIcons();
  }, [lucideLoaded, loading, error, visibleDocs.length, showAll]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!file) {
      setError("Please choose a file");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      if (title) fd.set("title", title);
      fd.set("category", category);
      fd.set("classification", classification);

      await apiRequest(`${API_BASE}/documents/upload`, {
        method: "POST",
        body: fd,
        token
      });

      const data = await graphqlRequest<DocumentsData>(
        `query { documents { id title ownerId filename category classification createdAt } }`
      );
      setDocs(data.documents);
      setTitle("");
      setFile(null);
      setFileLabel("Select or Drag File");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onSignOut() {
    signOut();
    router.push("/login");
  }

  const profileName = me?.username ?? "user";
  const profileTier = me?.isAdmin ? "Admin" : "Pro Account";
  const profileInitials = initials(me?.username || me?.email || "user");

  const quotaUsedGb = Math.min(0.6, 5.0);
  const quotaTotalGb = 5.0;
  const quotaPct = Math.round((quotaUsedGb / quotaTotalGb) * 100);

  return (
    <div className="text-gray-900" style={{ backgroundColor: "#F9FAFB" }}>
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Script
        src="https://unpkg.com/lucide@latest"
        strategy="afterInteractive"
        onLoad={() => setLucideLoaded(true)}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root {
            --brand-orange: #FF6B00;
            --brand-orange-light: #FFF5EE;
            --brand-dark: #1A1A1A;
          }
          body {
            background-color: #F9FAFB;
          }
          .bg-orange-gradient {
            background: linear-gradient(135deg, #FF6B00 0%, #FF9E5E 100%);
          }
          .text-orange-primary { color: #FF6B00; }
          .bg-orange-primary { background-color: #FF6B00; }
          .border-orange-primary { border-color: #FF6B00; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #FF6B0033; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF6B00; }
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
              <a href="#" className="text-orange-primary flex items-center gap-2">
                <i data-lucide="layout-grid" className="w-4 h-4"></i> Overview
              </a>
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
                onClick={onSignOut}
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
                <i data-lucide="files" className="w-4 h-4"></i> Document Vault
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your Workspace</h1>
              <p className="text-gray-500 mt-1 italic">Manage your secure documents and API integrations.</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <i
                  data-lucide="search"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                ></i>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search files..."
                  className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 transition-all w-64 shadow-sm"
                />
              </div>
              <button
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                onClick={() => setShowAll((v) => !v)}
                type="button"
              >
                <i data-lucide="filter" className="w-4 h-4"></i> {showAll ? "Mine" : "All"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Recent Documents</h3>
                  <button
                    className="text-sm font-semibold text-orange-primary hover:underline"
                    onClick={() => setShowAll(true)}
                    type="button"
                  >
                    Show all files
                  </button>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                          Security
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        <tr>
                          <td className="px-6 py-6 text-sm text-gray-400" colSpan={5}>
                            Loading documents...
                          </td>
                        </tr>
                      ) : visibleDocs.length ? (
                        visibleDocs.map((d) => {
                          const sec = securityBadge(d.classification);
                          return (
                            <tr
                              key={d.id}
                              className="hover:bg-orange-50/30 transition-colors group cursor-pointer"
                              onClick={() => router.push(`/documents/${d.id}`)}
                            >
                              <td className="px-6 py-5 text-sm font-mono text-gray-400">
                                #{String(d.id).padStart(4, "0")}
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-orange-primary">
                                    <i data-lucide="file-text" className="w-4 h-4"></i>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-800">{d.title}</div>
                                    <div className="text-xs text-gray-400">{d.filename}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${categoryBadge(
                                    d.category
                                  )}`}
                                >
                                  {d.category}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${sec.cls}`}
                                >
                                  {sec.label}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <button
                                  className="p-2 text-gray-400 hover:text-orange-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/documents/${d.id}`);
                                  }}
                                  type="button"
                                  aria-label="Open"
                                >
                                  <i data-lucide="more-vertical" className="w-5 h-5"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="px-6 py-10 text-center text-gray-300" colSpan={5}>
                            <div className="font-medium">No results found matching your search.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-8">
                <div className="flex items-center gap-2 mb-6 text-orange-primary font-bold text-sm uppercase tracking-widest">
                  <i data-lucide="plus-circle" className="w-5 h-5"></i> Quick Upload
                </div>

                <form onSubmit={onUpload} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      type="text"
                      placeholder="Project Name (Optional)"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Category
                    </label>
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Classification
                    </label>
                    <div className="relative">
                      <select
                        value={classification}
                        onChange={(e) => setClassification(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all appearance-none text-sm font-medium"
                      >
                        <option value="internal">Internal Only</option>
                        <option value="confidential">Confidential</option>
                        <option value="restricted">Top Secret / Restricted</option>
                      </select>
                      <i
                        data-lucide="chevron-down"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                      ></i>
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setFile(f);
                        setFileLabel(f?.name ?? "Select or Drag File");
                      }}
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center gap-2 w-full p-8 rounded-2xl bg-orange-50/30 border-2 border-dashed border-orange-100 cursor-pointer group-hover:border-orange-400 transition-all"
                    >
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-primary shadow-sm group-hover:scale-110 transition-transform">
                        <i data-lucide="upload" className="w-5 h-5"></i>
                      </div>
                      <span
                        className={`text-xs font-bold ${file ? "text-gray-800" : "text-orange-400"}`}
                        id="file-label"
                      >
                        {fileLabel}
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-4 bg-orange-gradient text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <i data-lucide="shield" className="w-5 h-5"></i>
                    {uploading ? "Uploading..." : "Secure Upload"}
                  </button>
                </form>
              </div>

              <div className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-orange-primary">
                    <i data-lucide="hard-drive" className="w-4 h-4"></i> Cloud Quota
                  </h4>
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-2xl font-black">{quotaPct}%</div>
                    <div className="text-xs text-gray-400 uppercase font-bold">
                      {quotaUsedGb.toFixed(1)} / {quotaTotalGb.toFixed(1)} GB
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full mb-6">
                    <div
                      className="h-full bg-orange-primary rounded-full shadow-[0_0_10px_#FF6B00]"
                      style={{ width: `${quotaPct}%` }}
                    ></div>
                  </div>
                  <button className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-bold hover:bg-white hover:text-gray-900 transition-all uppercase tracking-widest">
                    Upgrade Storage
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-primary/10 rounded-full blur-2xl group-hover:bg-orange-primary/20 transition-all"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-400">
            <span className="font-mono">Tip:</span> You can open a document by clicking its row.
          </div>
        </div>
      </main>
    </div>
  );
}

