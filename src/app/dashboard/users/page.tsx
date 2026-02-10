"use client";

import { useEffect, useState } from "react";

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const roleLabel: Record<string, string> = {
  master_admin: "Commander",
  admin: "Captain",
  super: "Lieutenant",
  seller: "Pilot",
};

const roleColor: Record<string, string> = {
  master_admin: "bg-[#FC3D21]/20 text-[#FC3D21]",
  admin: "bg-[#F0C030]/20 text-[#F0C030]",
  super: "bg-[#00B4D8]/20 text-[#00B4D8]",
  seller: "bg-[#105BD8]/20 text-[#2B7AE8]",
};

// What roles each role can create
const canCreate: Record<string, string[]> = {
  master_admin: ["admin", "super", "seller"],
  admin: ["super", "seller"],
  super: ["seller"],
  seller: [],
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "seller",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMyRole(d.role || ""));
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (data.success) {
      setSuccess(`Crew member "${form.username}" enlisted as ${roleLabel[form.role]}`);
      setForm({ username: "", email: "", password: "", role: "seller" });
      setShowCreate(false);
      fetchUsers();
    } else {
      setError(data.error || "Failed to enlist crew member");
    }
    setCreating(false);
  };

  const creatableRoles = canCreate[myRole] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Crew Management</h1>
        {creatableRoles.length > 0 && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-[#105BD8] text-white rounded-lg text-sm hover:bg-[#2B7AE8] transition"
          >
            {showCreate ? "Cancel" : "+ Enlist Crew"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Create User Form */}
      {showCreate && (
        <div className="mb-6 bg-[#111B33] rounded-xl border border-[#1C2B4A] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Enlist New Crew Member
          </h2>
          <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#7B8FB5] text-sm mb-1">
                Callsign
              </label>
              <input
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                required
                className="w-full px-4 py-2 bg-[#0B1026] border border-[#1C2B4A] rounded-lg text-white text-sm focus:border-[#105BD8] outline-none"
                placeholder="houston"
              />
            </div>
            <div>
              <label className="block text-[#7B8FB5] text-sm mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-2 bg-[#0B1026] border border-[#1C2B4A] rounded-lg text-white text-sm focus:border-[#105BD8] outline-none"
                placeholder="crew@nasa.space"
              />
            </div>
            <div>
              <label className="block text-[#7B8FB5] text-sm mb-1">
                Passcode
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
                minLength={6}
                className="w-full px-4 py-2 bg-[#0B1026] border border-[#1C2B4A] rounded-lg text-white text-sm focus:border-[#105BD8] outline-none"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-[#7B8FB5] text-sm mb-1">Rank</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2 bg-[#0B1026] border border-[#1C2B4A] rounded-lg text-white text-sm focus:border-[#105BD8] outline-none"
              >
                {creatableRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-[#105BD8] text-white rounded-lg text-sm hover:bg-[#2B7AE8] disabled:opacity-50 transition"
              >
                {creating ? "Enlisting..." : "Enlist Crew Member"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#111B33] rounded-xl border border-[#1C2B4A] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1C2B4A] text-[#7B8FB5]">
              <th className="text-left p-3">Callsign</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Rank</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Enlisted</th>
              <th className="text-left p-3">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[#7B8FB5]">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[#7B8FB5]">
                  No crew members found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u._id}
                  className="border-b border-[#1C2B4A]/50 hover:bg-[#1C2B4A]/30"
                >
                  <td className="p-3 text-white font-medium">{u.username}</td>
                  <td className="p-3 text-[#7B8FB5]">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        roleColor[u.role] || ""
                      }`}
                    >
                      {roleLabel[u.role] || u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        u.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {u.isActive ? "Active" : "Grounded"}
                    </span>
                  </td>
                  <td className="p-3 text-[#7B8FB5]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-[#7B8FB5]">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString()
                      : "Never"}
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
