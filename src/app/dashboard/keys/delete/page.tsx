"use client";
import { useState } from "react";

interface KeyResult {
    _id: string;
    key: string;
    status: string;
    createdBy: string;
    createdByRole: string;
    expiresAt: string | null;
    createdAt: string;
}

export default function ManageKeyPage() {
    const [search, setSearch] = useState("");
    const [keys, setKeys] = useState<KeyResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [extending, setExtending] = useState<string | null>(null);
    const [extendDays, setExtendDays] = useState<{ [key: string]: string }>({});
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const searchKeys = async () => {
        if (search.length < 2) return;
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/admin/keys/delete?search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setKeys(data.keys || []);
            if (data.keys?.length === 0) {
                setMessage({ text: "No keys found matching your search.", type: "error" });
            }
        } catch {
            setMessage({ text: "Failed to search keys.", type: "error" });
        }
        setLoading(false);
    };

    const deleteKey = async (key: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY DELETE this key?\n\n${key}\n\nThis action cannot be undone!`)) return;

        setDeleting(key);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/keys/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
            });
            const data = await res.json();
            if (data.success) {
                setKeys((prev) => prev.filter((k) => k.key !== key));
                setMessage({ text: `Key "${key}" deleted successfully!`, type: "success" });
            } else {
                setMessage({ text: data.error || "Failed to delete key.", type: "error" });
            }
        } catch {
            setMessage({ text: "Failed to delete key.", type: "error" });
        }
        setDeleting(null);
    };

    const extendKey = async (key: string) => {
        const days = extendDays[key];
        if (!days || isNaN(Number(days)) || Number(days) <= 0) {
            setMessage({ text: "Enter a valid number of days.", type: "error" });
            return;
        }

        setExtending(key);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/keys/extend", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, days: Number(days) }),
            });
            const data = await res.json();
            if (data.success) {
                setKeys((prev) =>
                    prev.map((k) =>
                        k.key === key
                            ? { ...k, expiresAt: data.newExpiry, status: k.status === "expired" ? "active" : k.status }
                            : k
                    )
                );
                setExtendDays((prev) => ({ ...prev, [key]: "" }));
                setMessage({ text: `Key "${key}" extended by ${days} days!`, type: "success" });
            } else {
                setMessage({ text: data.error || "Failed to extend key.", type: "error" });
            }
        } catch {
            setMessage({ text: "Failed to extend key.", type: "error" });
        }
        setExtending(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-500/20 text-green-600 border-green-500/30";
            case "expired": return "bg-red-500/20 text-red-600 border-red-500/30";
            case "banned": return "bg-orange-500/20 text-orange-600 border-orange-500/30";
            case "inactive": return "bg-gray-500/20 text-gray-600 border-gray-500/30";
            case "pending": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
            default: return "bg-gray-500/20 text-gray-600 border-gray-500/30";
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case "admin": return "text-purple-600";
            case "super": return "text-blue-600";
            case "seller": return "text-green-600";
            case "master_admin": return "text-red-600";
            default: return "text-gray-600";
        }
    };

    const getDaysLeft = (expiresAt: string | null) => {
        if (!expiresAt) return "∞";
        const ms = new Date(expiresAt).getTime() - Date.now();
        const days = Math.ceil(ms / 86400000);
        if (days <= 0) return "Expired";
        return `${days}d left`;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-[#222D32] rounded-t-lg border-b border-[#367FA9]">
                <div className="px-5 py-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#3C8DBC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-white font-bold text-[16px]">Manage Key</h2>
                    <span className="text-gray-400 text-xs ml-2">Delete or Extend Keys</span>
                </div>
            </div>

            <div className="bg-white rounded-b-lg shadow-sm p-5">
                {/* Search Bar */}
                <div className="flex gap-3 mb-5">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && searchKeys()}
                            placeholder="Search by key name (min 2 characters)..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent"
                        />
                        {search && (
                            <button
                                onClick={() => { setSearch(""); setKeys([]); setMessage(null); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        onClick={searchKeys}
                        disabled={loading || search.length < 2}
                        className="px-6 py-2.5 bg-[#3C8DBC] text-white rounded-lg font-semibold text-sm hover:bg-[#367FA9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                        Search
                    </button>
                </div>

                {/* Messages */}
                {message && (
                    <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {message.text}
                    </div>
                )}

                {/* Results Table */}
                {keys.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#F5F5F5] border-b">
                                    <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider">#</th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Key</th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Created By</th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Expires</th>
                                    <th className="text-center px-3 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Extend</th>
                                    <th className="text-center px-3 py-2.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keys.map((k, i) => (
                                    <tr key={k._id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2.5 text-gray-500 text-xs">{i + 1}</td>
                                        <td className="px-3 py-2.5">
                                            <code className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-mono text-gray-700">{k.key}</code>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(k.status)}`}>
                                                {k.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`font-semibold text-xs ${getRoleColor(k.createdByRole)}`}>{k.createdBy}</span>
                                            <span className="text-gray-400 text-[10px] ml-1">({k.createdByRole})</span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="text-gray-500 text-xs">
                                                {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "∞ Lifetime"}
                                            </div>
                                            <div className={`text-[10px] font-bold ${getDaysLeft(k.expiresAt) === "Expired" ? "text-red-500" : "text-green-600"}`}>
                                                {getDaysLeft(k.expiresAt)}
                                            </div>
                                        </td>
                                        {/* Extend Controls */}
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-1.5 justify-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Days"
                                                    value={extendDays[k.key] || ""}
                                                    onChange={(e) => setExtendDays((prev) => ({ ...prev, [k.key]: e.target.value }))}
                                                    onKeyDown={(e) => e.key === "Enter" && extendKey(k.key)}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                />
                                                <button
                                                    onClick={() => extendKey(k.key)}
                                                    disabled={extending === k.key || !extendDays[k.key]}
                                                    className="px-2.5 py-1 bg-blue-500 text-white rounded text-[11px] font-bold hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                                                >
                                                    {extending === k.key ? (
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                                                        </svg>
                                                    )}
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        {/* Delete */}
                                        <td className="px-3 py-2.5 text-center">
                                            <button
                                                onClick={() => deleteKey(k.key)}
                                                disabled={deleting === k.key}
                                                className="px-2.5 py-1 bg-red-500 text-white rounded text-[11px] font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                                            >
                                                {deleting === k.key ? (
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                                Del
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="text-right text-[11px] text-gray-400 mt-2 px-3">
                            Showing {keys.length} result{keys.length !== 1 ? "s" : ""}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {keys.length === 0 && !message && !loading && (
                    <div className="text-center py-12 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm">Search for a key to manage it.</p>
                        <p className="text-xs mt-1 text-gray-300">You can extend the expiry or permanently delete any key.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
