"use client";

import { useEffect, useState } from "react";

interface LicenseKey {
  _id: string;
  key: string;
  status: string;
  tier: string;
  hwid: string | null;
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  notes: string;
  createdBy: { username: string; role: string } | null;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);

    const res = await fetch(`/api/admin/keys?${params}`);
    const data = await res.json();
    setKeys(data.keys || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, [filterStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeys();
  };

  const updateKey = async (id: string, updates: any) => {
    await fetch(`/api/admin/keys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchKeys();
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Decommission this access key permanently?")) return;
    await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
    fetchKeys();
  };

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    expired: "bg-yellow-500/20 text-yellow-400",
    banned: "bg-red-500/20 text-red-400",
    inactive: "bg-gray-500/20 text-gray-400",
    pending: "bg-cyan-500/20 text-cyan-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Access Keys</h1>
        <span className="text-[#7B8FB5] text-sm">{total} deployed</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keys..."
            className="flex-1 px-4 py-2 rounded-lg text-sm"
          />
          <button type="submit" className="px-4 py-2 bg-[#105BD8] text-white rounded-lg text-sm hover:bg-[#2B7AE8] transition">
            Search
          </button>
        </form>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="banned">Banned</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Keys Table */}
      <div className="bg-[#111B33] rounded-xl border border-[#1C2B4A] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1C2B4A] text-[#7B8FB5]">
              <th className="text-left p-3">Key</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Source</th>
              <th className="text-left p-3">Tier</th>
              <th className="text-left p-3">HWID</th>
              <th className="text-left p-3">Expires</th>
              <th className="text-left p-3">Last Used</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-[#7B8FB5]">Loading...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-[#7B8FB5]">No keys found. Generate some!</td></tr>
            ) : (
              keys.map((k) => (
                <tr key={k._id} className="border-b border-[#1C2B4A]/50 hover:bg-[#1C2B4A]/30">
                  <td className="p-3 font-mono text-xs select-all">{k.key}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColor[k.status] || ""}`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {k.notes === "FREE_DEMO" ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">Demo</span>
                    ) : k.createdBy ? (
                      <span className="text-xs text-[#7B8FB5]">{k.createdBy.username}</span>
                    ) : (
                      <span className="text-xs text-[#7B8FB5]">---</span>
                    )}
                  </td>
                  <td className="p-3 capitalize">{k.tier}</td>
                  <td className="p-3 font-mono text-xs text-[#7B8FB5]">
                    {k.hwid ? k.hwid.substring(0, 12) + "..." : "---"}
                  </td>
                  <td className="p-3 text-[#7B8FB5]">
                    {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Lifetime"}
                  </td>
                  <td className="p-3 text-[#7B8FB5]">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {k.status === "pending" && (
                        <button onClick={() => updateKey(k._id, { approve: true })}
                          className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30">
                          Approve
                        </button>
                      )}
                      {k.status === "active" ? (
                        <button onClick={() => updateKey(k._id, { status: "banned" })}
                          className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30">
                          Ban
                        </button>
                      ) : k.status === "banned" ? (
                        <button onClick={() => updateKey(k._id, { status: "active" })}
                          className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30">
                          Unban
                        </button>
                      ) : null}
                      {k.hwid && (
                        <button onClick={() => updateKey(k._id, { resetHwid: true })}
                          className="px-2 py-1 bg-[#105BD8]/20 text-[#2B7AE8] rounded text-xs hover:bg-[#105BD8]/30">
                          MAC Reset
                        </button>
                      )}
                      <button onClick={() => deleteKey(k._id)}
                        className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs hover:bg-gray-500/30">
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
