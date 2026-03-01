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

  const [creating, setCreating] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createIsAdmin, setCreateIsAdmin] = useState(false);

  const [userActionId, setUserActionId] = useState<string | null>(null);
  const [docActionId, setDocActionId] = useState<number | null>(null);

  async function refresh() {
    const res = await graphqlRequest<AdminData>(`
      query {
        users { id username email isAdmin createdAt }
        documents { id title ownerId filename category classification createdAt }
      }
    `);
    setData(res);
  }

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
  }, [lucideLoaded, loading, error, data?.users?.length, data?.documents?.length, creating, userActionId, docActionId]);

  function onLogout() {
    signOut();
    router.push("/login");
  }

  async function onCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await graphqlRequest<{ adminCreateUser: { id: string } }>(
        `mutation Create($input:AdminCreateUserInput!){ adminCreateUser(input:$input){ id } }`,
        {
          input: {
            username: createUsername,
            email: createEmail,
            password: createPassword,
            isAdmin: createIsAdmin
          }
        }
      );
      setCreateUsername("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateIsAdmin(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function toggleAdmin(u: AdminUser) {
    setError(null);
    setUserActionId(u.id);
    try {
      await graphqlRequest<{ adminSetUserAdmin: { id: string } }>(
        `mutation SetAdmin($userId:ID!,$isAdmin:Boolean!){ adminSetUserAdmin(userId:$userId,isAdmin:$isAdmin){ id } }`,
        { userId: u.id, isAdmin: !u.isAdmin }
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setUserActionId(null);
    }
  }

  async function updateDocClassification(id: number, classification: string) {
    setError(null);
    setDocActionId(id);
    try {
      await graphqlRequest<{ adminUpdateDocument: { id: number } }>(
        `mutation UpdateDoc($id:Int!,$classification:String){ adminUpdateDocument(id:$id,classification:$classification){ id } }`,
        { id, classification }
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document");
    } finally {
      setDocActionId(null);
    }
  }

  async function deleteDoc(id: number) {
    setError(null);
    setDocActionId(id);
    try {
      await graphqlRequest<{ adminDeleteDocument: { ok: boolean; message: string } }>(
        `mutation DeleteDoc($id:Int!){ adminDeleteDocument(id:$id){ ok message } }`,
        { id }
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDocActionId(null);
    }
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
            {/* Create user (left) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-8">
                <div className="flex items-center gap-2 mb-6 text-orange-primary font-bold text-sm uppercase tracking-widest">
                  <i data-lucide="user-plus" className="w-5 h-5"></i> Create User
                </div>
                <form onSubmit={onCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                        Username
                      </label>
                      <input
                        value={createUsername}
                        onChange={(e) => setCreateUsername(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                        placeholder="new.user"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                        Email
                      </label>
                      <input
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        type="email"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                        placeholder="user@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                      Password
                    </label>
                    <input
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      type="password"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all text-sm"
                      placeholder="Set an initial password"
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={createIsAdmin}
                      onChange={(e) => setCreateIsAdmin(e.target.checked)}
                      className="w-4 h-4 accent-[#FF6B00]"
                    />
                    Create as admin
                  </label>
                  <button
                    type="submit"
                    disabled={creating || !createUsername || !createEmail || !createPassword}
                    className="w-full py-4 bg-orange-gradient text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-100 hover:shadow-orange-200 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <i data-lucide="plus" className="w-5 h-5"></i>
                    {creating ? "Creating..." : "Create user"}
                  </button>
                </form>
              </div>
            </div>

            {/* Documents (right) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <i data-lucide="files" className="w-4 h-4 text-orange-primary"></i> Documents
                  </h3>
                  <div className="text-xs text-gray-400">{loading ? "Loading…" : `${documents.length} total`}</div>
                </div>
                <div className="overflow-auto max-h-[520px]">
                  <table className="min-w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Classification</th>
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
                              <div className="inline-flex items-center gap-2 justify-end">
                                <select
                                  value={d.classification}
                                  disabled={docActionId === d.id}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateDocClassification(d.id, e.target.value)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white ${badgeForClassification(
                                    d.classification
                                  )}`}
                                >
                                  <option value="public">public</option>
                                  <option value="internal">internal</option>
                                  <option value="confidential">confidential</option>
                                  <option value="restricted">restricted</option>
                                </select>
                                <button
                                  type="button"
                                  disabled={docActionId === d.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteDoc(d.id);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                                >
                                  {docActionId === d.id ? "..." : "Delete"}
                                </button>
                              </div>
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

            {/* Users table (full width) */}
            <div className="lg:col-span-12">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <i data-lucide="users" className="w-4 h-4 text-orange-primary"></i> Users
                  </h3>
                  <div className="text-xs text-gray-400">{loading ? "Loading…" : `${users.length} total`}</div>
                </div>
                <div className="overflow-auto max-h-[520px]">
                  <table className="min-w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Role</th>
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
                            <td className="px-6 py-5 text-sm font-semibold text-gray-900 whitespace-nowrap">{u.username}</td>
                            <td className="px-6 py-5 text-sm text-gray-600 max-w-[520px] truncate">{u.email}</td>
                            <td className="px-6 py-5 text-right">
                              <div className="inline-flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badgeForRole(
                                    u.isAdmin
                                  )}`}
                                >
                                  {u.isAdmin ? "Admin" : "User"}
                                </span>
                                <button
                                  type="button"
                                  disabled={userActionId === u.id}
                                  onClick={() => toggleAdmin(u)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                  {userActionId === u.id ? "..." : u.isAdmin ? "Demote" : "Promote"}
                                </button>
                              </div>
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
          </div>
        </div>
      </main>
    </div>
  );
}

