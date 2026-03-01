"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { graphqlRequest } from "@/lib/api";
import { getToken, getUser, signOut } from "@/lib/auth";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt?: string | null;
};

type AdminDoc = {
  id: number;
  title: string;
  ownerId: string;
  filename: string;
  category: string;
  classification: string;
  createdAt?: string | null;
};

type AdminData = {
  users: AdminUser[];
  documents: AdminDoc[];
};

function badgeForRole(isAdmin: boolean) {
  return isAdmin
    ? "bg-orange-50 text-orange-primary border border-orange-100"
    : "bg-gray-50 text-gray-600 border border-gray-100";
}

function badgeForClassification(classification: string) {
  const cl = (classification || "internal").toLowerCase();
  if (cl === "public") return "bg-blue-50 text-blue-600 border border-blue-100";
  if (cl === "confidential") return "bg-green-50 text-green-600 border border-green-100";
  if (cl === "restricted") return "bg-red-50 text-red-600 border border-red-100";
  return "bg-orange-50 text-orange-600 border border-orange-100";
}

export default function AdminPage() {
  const router = useRouter();
  const token = useMemo(() => getToken(), []);
  const me = useMemo(() => getUser(), []);

  const [lucideLoaded, setLucideLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);

  useEffect(() => {
    if (!token || !me) router.push("/login");
  }, [token, me, router]);

  useEffect(() => {
    if (!me) return;
    if (!me.isAdmin) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await graphqlRequest<AdminData>(`
          query {
            users { id username email isAdmin createdAt }
            documents { id title ownerId filename category classification createdAt }
          }
        `);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load admin data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [me?.isAdmin]);

  useEffect(() => {
    if (!lucideLoaded) return;
    const w = window as any;
    if (w?.lucide?.createIcons) w.lucide.createIcons();
  }, [lucideLoaded, loading, error, data?.users?.length, data?.documents?.length]);

  function onLogout() {
    signOut();
    router.push("/login");
  }

  if (me && !me.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white border border-red-100 rounded-[2rem] shadow-xl shadow-gray-200/40 p-10">
          <div className="text-red-700 font-extrabold text-2xl">Access denied</div>
          <div className="text-gray-500 mt-2">You don’t have permission to view the admin console.</div>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold shadow-sm hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              onClick={() => router.push("/dashboard")}
            >
              <i data-lucide="arrow-left" className="w-4 h-4"></i> Back to dashboard
            </button>
            <button
              type="button"
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold shadow-sm hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              onClick={onLogout}
            >
              <i data-lucide="log-out" className="w-4 h-4"></i> Logout
            </button>
          </div>
        </div>
        <Script src="https://unpkg.com/lucide@latest" strategy="afterInteractive" onLoad={() => setLucideLoaded(true)} />
      </div>
    );
  }

  const users = data?.users ?? [];
  const documents = data?.documents ?? [];

  return (
    <div className="text-gray-900" style={{ backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Script src="https://unpkg.com/lucide@latest" strategy="afterInteractive" onLoad={() => setLucideLoaded(true)} />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root { --brand-orange: #FF6B00; }
          .bg-orange-gradient { background: linear-gradient(135deg, #FF6B00 0%, #FF9E5E 100%); }
          .text-orange-primary { color: #FF6B00; }
          .bg-orange-primary { background-color: #FF6B00; }
        `
        }}
      />

      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <button className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")} type="button">
              <div className="w-10 h-10 bg-orange-gradient rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <i data-lucide="shield-check" className="text-white w-6 h-6"></i>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Cipher<span className="text-orange-primary">Docs</span>
              </span>
            </button>

            <div className="hidden md:flex items-center space-x-8 font-medium text-gray-600">
              <button type="button" onClick={() => router.push("/dashboard")} className="hover:text-orange-primary transition-colors flex items-center gap-2">
                <i data-lucide="layout-grid" className="w-4 h-4"></i> Dashboard
              </button>
              <span className="text-orange-primary flex items-center gap-2">
                <i data-lucide="crown" className="w-4 h-4"></i> Admin
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{me?.username ?? "admin"}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center text-orange-primary font-bold">
                  {(me?.username ?? "A").slice(0, 1).toUpperCase()}
                </div>
              </div>
              <button
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold shadow-sm hover:bg-gray-50 hover:text-orange-primary transition-colors flex items-center gap-2"
                onClick={onLogout}
                type="button"
                aria-label="Logout"
              >
                <i data-lucide="log-out" className="w-5 h-5"></i>
                <span className="hidden sm:inline">Logout</span>
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
                <i data-lucide="crown" className="w-4 h-4"></i> Admin Console
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Administration</h1>
              <p className="text-gray-500 mt-1 italic">User management and system visibility.</p>
            </div>
          </div>

          {error ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">{error}</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-7">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Users</div>
              <div className="text-3xl font-extrabold">{loading ? "…" : users.length}</div>
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-7">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Documents</div>
              <div className="text-3xl font-extrabold">{loading ? "…" : documents.length}</div>
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-7">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Status</div>
              <div className="text-sm font-semibold text-gray-700">{loading ? "Loading…" : "Online"}</div>
              <div className="text-xs text-gray-400 mt-1">GraphQL-backed admin console</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <i data-lucide="users" className="w-4 h-4 text-orange-primary"></i> Users
                  </h3>
                  <div className="text-xs text-gray-400">{loading ? "Loading…" : `${users.length} total`}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        <tr>
                          <td className="px-6 py-6 text-sm text-gray-400" colSpan={3}>
                            Loading users...
                          </td>
                        </tr>
                      ) : users.length ? (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-orange-50/30 transition-colors">
                            <td className="px-6 py-5 text-sm font-semibold text-gray-900">{u.username}</td>
                            <td className="px-6 py-5 text-sm text-gray-600">{u.email}</td>
                            <td className="px-6 py-5 text-right">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badgeForRole(u.isAdmin)}`}>
                                {u.isAdmin ? "Admin" : "User"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-6 py-8 text-sm text-gray-400" colSpan={3}>
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <i data-lucide="files" className="w-4 h-4 text-orange-primary"></i> Documents
                  </h3>
                  <div className="text-xs text-gray-400">{loading ? "Loading…" : `${documents.length} total`}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                          Classification
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        <tr>
                          <td className="px-6 py-6 text-sm text-gray-400" colSpan={3}>
                            Loading documents...
                          </td>
                        </tr>
                      ) : documents.length ? (
                        documents.slice(0, 50).map((d) => (
                          <tr
                            key={d.id}
                            className="hover:bg-orange-50/30 transition-colors cursor-pointer"
                            onClick={() => router.push(`/documents/${d.id}`)}
                          >
                            <td className="px-6 py-5 text-sm font-mono text-gray-400">#{String(d.id).padStart(4, "0")}</td>
                            <td className="px-6 py-5">
                              <div className="font-semibold text-gray-800">{d.title}</div>
                              <div className="text-xs text-gray-400">{d.filename}</div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badgeForClassification(d.classification)}`}>
                                {d.classification}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-6 py-8 text-sm text-gray-400" colSpan={3}>
                            No documents found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {!loading && documents.length > 50 ? (
                  <div className="px-6 py-4 text-xs text-gray-400 border-t border-gray-50">
                    Showing 50 of {documents.length}. Use GraphQL for full export.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

