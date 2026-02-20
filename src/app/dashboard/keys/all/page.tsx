"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LicenseKey {
  _id: string;
  key: string;
  status: string;
  tier: string;
  hwid: string | null;
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  notes: string;
  createdBy: { _id: string; username: string; role: string } | null;
  approvedBy: any;
  hwidResetsUsed?: number;
  maxHwidResets?: number;
}

function getRemainingDays(expiresAt: string | null): number {
  if (!expiresAt) return 999;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function roleBadge(role: string | undefined) {
  if (!role) return null;
  const map: Record<string, { bg: string; text: string; label: string }> = {
    master_admin: { bg: "bg-purple-100", text: "text-purple-700", label: "Master" },
    admin: { bg: "bg-red-100", text: "text-red-700", label: "Admin" },
    super: { bg: "bg-blue-100", text: "text-blue-700", label: "Super" },
    seller: { bg: "bg-green-100", text: "text-green-700", label: "Seller" },
  };
  const m = map[role] || { bg: "bg-gray-100", text: "text-gray-700", label: role };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

export default function AllKeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.role !== "master_admin") {
          router.push("/dashboard");
          return;
        }
        fetchAllKeys();
      });
  }, [router]);

  const fetchAllKeys = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/keys?limit=2000");
    const data = await res.json();
    setKeys(data.keys || []);
    setLoading(false);
  };

  const updateKey = async (id: string, updates: any) => {
    await fetch(`/api/admin/keys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchAllKeys();
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Delete this key permanently?")) return;
    await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
    fetchAllKeys();
  };

  const resetHwid = async (key: LicenseKey) => {
    if (!key.hwid) return;
    if (!confirm(`Reset MAC for ${key.key}? (${key.hwidResetsUsed || 0}/${key.maxHwidResets || 3} used)`)) return;
    const res = await fetch(`/api/admin/keys/${key._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetHwid: true }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Failed to reset MAC");
    fetchAllKeys();
  };

  const editKeyNotes = async (key: LicenseKey) => {
    const newNotes = prompt("Enter new Customer Name (Notes):", key.notes);
    if (newNotes === null) return;
    await updateKey(key._id, { notes: newNotes });
  };

  const filtered = keys.filter((k) => {
    if (statusFilter !== "all" && k.status !== statusFilter) return false;
    const s = searchTerm.toLowerCase();
    if (!s) return true;
    return (
      k.key.toLowerCase().includes(s) ||
      (k.notes || "").toLowerCase().includes(s) ||
      (k.createdBy?.username || "").toLowerCase().includes(s) ||
      (k.lastUsedIp || "").includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: keys.length,
    active: keys.filter((k) => k.status === "active").length,
    banned: keys.filter((k) => k.status === "banned").length,
    pending: keys.filter((k) => k.status === "pending").length,
    expired: keys.filter((k) => k.status === "expired").length,
    paid: keys.filter((k) => !!k.approvedBy).length,
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9] text-gray-800">
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm min-h-[50px]">
        <h1 className="text-2xl font-light text-gray-700">All Keys</h1>
        <div className="text-sm">
          <span className="text-[#337ab7]">Home</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-gray-500">All Keys</span>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-auto custom-scrollbar">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {[
            { label: "Total Keys", value: stats.total, color: "bg-[#3C8DBC]" },
            { label: "Active", value: stats.active, color: "bg-green-500" },
            { label: "Banned", value: stats.banned, color: "bg-red-500" },
            { label: "Pending", value: stats.pending, color: "bg-yellow-500" },
            { label: "Expired", value: stats.expired, color: "bg-gray-500" },
            { label: "Paid", value: stats.paid, color: "bg-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded shadow-sm overflow-hidden">
              <div className={`h-1 ${s.color}`} />
              <div className="p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[14px] text-gray-700 font-medium">All Keys — Global View</span>
            <button
              onClick={fetchAllKeys}
              className="px-3 py-1 text-xs bg-[#3C8DBC] text-white rounded hover:bg-[#367FA9] transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="p-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-bold text-gray-500 uppercase">Status:</span>
                {["all", "active", "pending", "banned", "expired"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`px-3 py-1 text-[12px] rounded border transition-colors ${
                      statusFilter === s
                        ? "bg-[#337ab7] text-white border-[#337ab7]"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-600">Search:</span>
                <input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="key, customer, seller, IP..."
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 w-56"
                />
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-[#3C8DBC] rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-[13px] text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200">
                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] whitespace-nowrap">Customer</th>
                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] whitespace-nowrap">Key</th>
                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] whitespace-nowrap">Created By</th>
                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] text-center whitespace-nowrap">Days Left</th>
                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] text-center whitespace-nowrap">Status</th>
                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] text-center whitespace-nowrap">IP</th>
                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] text-center whitespace-nowrap">Paid</th>
                        <th className="p-2.5 font-bold text-[#337ab7] whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paged.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center italic text-gray-400">
                            No keys found.
                          </td>
                        </tr>
                      ) : (
                        paged.map((k, i) => {
                          const isPaid = !!k.approvedBy;
                          const isActive = k.status === "active";
                          const isBanned = k.status === "banned";
                          const isPending = k.status === "pending";
                          const remaining = getRemainingDays(k.expiresAt);

                          return (
                            <tr key={k._id} className={`${i % 2 === 1 ? "bg-[#fcfcfc]" : ""} hover:bg-gray-50`}>
                              <td className="p-2.5 border-r border-gray-100 font-medium text-gray-700 whitespace-nowrap">
                                {k.notes || "—"}
                              </td>
                              <td className="p-2.5 border-r border-gray-100 whitespace-nowrap">
                                <span className={`font-mono text-xs font-bold ${isPending ? "text-yellow-600" : isBanned ? "text-red-500" : "text-green-600"}`}>
                                  {k.key}
                                </span>
                              </td>
                              <td className="p-2.5 border-r border-gray-100 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-gray-800">{k.createdBy?.username || "—"}</span>
                                  {roleBadge(k.createdBy?.role)}
                                </div>
                              </td>
                              <td className="p-2.5 border-r border-gray-100 text-center text-gray-700">
                                {remaining === 999 ? "∞" : remaining}
                              </td>
                              <td className="p-2.5 border-r border-gray-100 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  isActive ? "bg-green-100 text-green-700" :
                                  isBanned ? "bg-red-100 text-red-700" :
                                  isPending ? "bg-yellow-100 text-yellow-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>
                                  {k.status}
                                </span>
                              </td>
                              <td className="p-2.5 border-r border-gray-100 text-center text-gray-500 text-xs">
                                {k.lastUsedIp || "—"}
                              </td>
                              <td className="p-2.5 border-r border-gray-100 text-center">
                                <span className={`font-medium ${isPaid ? "text-green-600" : "text-red-500"}`}>
                                  {isPaid ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <div className="flex gap-1.5 items-center">
                                  {/* Ban / Activate */}
                                  <button
                                    title={isBanned ? "Activate" : "Ban"}
                                    onClick={() => {
                                      const action = isBanned ? "activate" : "ban";
                                      if (confirm(`${action} this key?`)) {
                                        updateKey(k._id, { status: isBanned ? "active" : "banned" });
                                      }
                                    }}
                                    className={`w-7 h-7 flex items-center justify-center border rounded transition-colors bg-white shadow-sm ${
                                      isBanned ? "border-green-500 text-green-500 hover:bg-green-50" : "border-red-500 text-red-500 hover:bg-red-50"
                                    }`}
                                  >
                                    {isBanned ? (
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                  </button>

                                  {/* Reset HWID */}
                                  {k.hwid && (
                                    <button
                                      title="Reset MAC (HWID)"
                                      onClick={() => resetHwid(k)}
                                      className="w-7 h-7 flex items-center justify-center border border-blue-500 rounded text-blue-500 hover:bg-blue-50 transition-colors bg-white shadow-sm"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    </button>
                                  )}

                                  {/* Approve / Pay */}
                                  {!isPaid && (
                                    <button
                                      title="Approve / Mark Paid"
                                      onClick={() => {
                                        if (confirm("Mark this key as paid?")) {
                                          updateKey(k._id, { approve: true });
                                        }
                                      }}
                                      className="w-7 h-7 flex items-center justify-center border border-green-500 rounded text-green-600 hover:bg-green-50 transition-colors bg-white shadow-sm"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                    </button>
                                  )}

                                  {/* Edit Notes */}
                                  <button
                                    title="Edit Customer Name"
                                    onClick={() => editKeyNotes(k)}
                                    className="w-7 h-7 flex items-center justify-center border border-blue-400 rounded text-blue-500 hover:bg-blue-50 transition-colors bg-white shadow-sm"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>

                                  {/* Delete */}
                                  <button
                                    title="Delete Key"
                                    onClick={() => deleteKey(k._id)}
                                    className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-400 transition-colors bg-white shadow-sm"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                  <div>
                    Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1} to{" "}
                    {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
                  </div>
                  <div className="flex border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-gray-50 border-r border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 7) {
                        p = i + 1;
                      } else if (page <= 4) {
                        p = i + 1;
                      } else if (page >= totalPages - 3) {
                        p = totalPages - 6 + i;
                      } else {
                        p = page - 3 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-1 border-r border-gray-300 ${
                            p === page ? "bg-[#4A90D9] text-white font-bold" : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="px-5 py-3 flex justify-between items-center text-[12px] text-gray-500 border-t border-gray-200 bg-white">
        <div>
          Copyright © 2026 <span className="text-[#337ab7] font-medium">AI Interface portal.</span> All rights reserved.
        </div>
        <div>Version 1.1</div>
      </footer>
    </div>
  );
}
