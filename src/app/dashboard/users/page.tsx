"use client";

import { useEffect, useState } from "react";

interface User {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  displayPassword?: string;
  isActive: boolean;
  isBanned?: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  paymentDue: number;
  todaySold: number;
  activeSold: number;
  totalSold: number;
  todayPaid: number;
  totalPaid: number;
  totalUnpaid: number;
  sellerCount?: number;
  createdBy?: { displayName: string; username: string };
}

export default function UsersPage() {
  const [myRole, setMyRole] = useState("");
  const [activeTab, setActiveTab] = useState<"super" | "seller" | "admin">("seller");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColModal, setShowColModal] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  // Add Payment modal
  const [payUser, setPayUser] = useState<User | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payMsg, setPayMsg] = useState("");

  // Deactivate/Ban Confirmations
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [banUser, setBanUser] = useState<User | null>(null);
  const [actionSaving, setActionSaving] = useState(false);

  const [cols, setCols] = useState({
    customer: true,
    username: true,
    password: true,
    paymentDue: true,
    todaySold: true,
    totalSold: true,
    todayPaid: true,
    totalPaid: true,
    totalUnpaid: true,
    action: true,
  });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setMyRole(d.role);
      const defaultTab = (d.role === "master_admin") ? "admin" : (d.role === "admin") ? "super" : "seller";
      setActiveTab(defaultTab as any);
    });
  }, []);

  useEffect(() => {
    if (!myRole) return;
    fetchUsers(activeTab);
  }, [activeTab, myRole]);

  const fetchUsers = async (role: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=${role}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);



  // Edit save
  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSaving(true);
    setEditMsg("");
    try {
      const body: any = {};
      if (editPassword) body.password = editPassword;
      if (editUser.displayName) body.displayName = editUser.displayName;
      const res = await fetch(`/api/admin/users/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok) {
        setEditMsg("Saved successfully!");
        fetchUsers(activeTab);
        setTimeout(() => { setEditUser(null); setEditMsg(""); setEditPassword(""); }, 1000);
      } else {
        setEditMsg(d.error || "Failed to save.");
      }
    } catch {
      setEditMsg("Error saving.");
    }
    setEditSaving(false);
  };

  // Add payment save
  const handlePaySave = async () => {
    if (!payUser || !payAmount) return;
    setPaySaving(true);
    setPayMsg("");
    try {
      const res = await fetch(`/api/admin/users/${payUser._id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payAmount), note: payNote }),
      });
      const d = await res.json();
      if (res.ok) {
        setPayMsg("Payment added!");
        fetchUsers(activeTab);
        setTimeout(() => { setPayUser(null); setPayMsg(""); setPayAmount(""); setPayNote(""); }, 1000);
      } else {
        setPayMsg(d.error || "Failed to add payment.");
      }
    } catch {
      setPayMsg("Error adding payment.");
    }
    setPaySaving(false);
  };

  const handleToggleStatus = async (user: User, field: "isActive" | "isBanned", value: boolean) => {
    setActionSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        fetchUsers(activeTab);
        setDeactivateUser(null);
        setBanUser(null);
      }
    } catch (e) {
      console.error(e);
    }
    setActionSaving(false);
  };

  const isMaster = myRole === "master_admin";
  const isAdminRole = myRole === "admin" || myRole === "master_admin";

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9] text-gray-800">
      {/* Top bar matching Snip 893 */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm min-h-[50px]">
        <h1 className="text-2xl font-light text-gray-700">View Seller</h1>
        <div className="text-sm">
          <span className="text-[#337ab7]">Home</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-gray-500">View Seller</span>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-auto custom-scrollbar">
        <div className="bg-white rounded shadow-sm">
          <div className="p-3 border-b border-gray-100 text-[14px] text-gray-700">Seller List</div>
          <div className="p-4 space-y-4">

            {/* Radio tabs — matching Snip 893 */}
            {isAdminRole && (
              <div className="flex items-center gap-5 text-[14px] font-bold text-gray-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="role" checked={activeTab === "super"} onChange={() => { setActiveTab("super"); setPage(1); }} className="accent-[#d9534f] w-4 h-4" />
                  <span>Super Seller</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="role" checked={activeTab === "seller"} onChange={() => { setActiveTab("seller"); setPage(1); }} className="accent-[#d9534f] w-4 h-4" />
                  <span>Seller</span>
                </label>
                {isMaster && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="role" checked={activeTab === "admin"} onChange={() => { setActiveTab("admin"); setPage(1); }} className="accent-[#d9534f] w-4 h-4" />
                    <span>Mini Admin</span>
                  </label>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex flex-wrap gap-1">
                <button onClick={() => navigator.clipboard.writeText(paged.map(u => [u.displayName, u.username, u.displayPassword].join('\t')).join('\n'))}
                  className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268] transition-all">Copy</button>
                <button className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268] transition-all">CSV</button>
                <button className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268] transition-all">Excel</button>
                <button className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268] transition-all">PDF</button>
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268] transition-all">Print</button>
                <div className="relative">
                  <button onClick={() => setShowColModal(!showColModal)}
                    className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268] flex items-center gap-1 transition-all">
                    Column visibility <span className="text-[10px]">▼</span>
                  </button>
                  {showColModal && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-xl z-50 py-1 w-44 text-left text-gray-700 rounded overflow-hidden">
                      {Object.keys(cols).map(k => (
                        <div key={k} onClick={() => setCols({ ...cols, [k]: !(cols as any)[k] })}
                          className={`px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-[12px] ${!(cols as any)[k] ? 'opacity-40' : 'font-semibold'}`}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-600 font-medium">Search:</span>
                <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 w-44 shadow-sm" />
              </div>
            </div>

            {/* Table — Matching Snip 893 Master Design Exactly */}
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-[#333]">
                    <th className="p-3 border-r border-gray-100 font-bold whitespace-nowrap">Name ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold whitespace-nowrap">Username ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold whitespace-nowrap">Password ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold text-center whitespace-nowrap">Super ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold text-center whitespace-nowrap">Seller ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold text-center whitespace-nowrap">Total Key ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold text-center whitespace-nowrap">Total Paid ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold text-center whitespace-nowrap">Total Active ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold text-center whitespace-nowrap">Today Create ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold text-center whitespace-nowrap">Today Paid ↕</th>
                    <th className="p-3 border-r border-gray-100 font-bold text-center whitespace-nowrap">Payment Due ↕</th>
                    <th className="p-3 font-bold whitespace-nowrap">Action ↕</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={12} className="p-10 text-center animate-pulse text-gray-400">Loading...</td></tr>
                  ) : paged.length === 0 ? (
                    <tr><td colSpan={12} className="p-10 text-center italic text-gray-400">No entries found.</td></tr>
                  ) : (
                    paged.map((u: any, i) => (
                      <tr key={u._id} className={`${i % 2 === 1 ? 'bg-[#fcfcfc]' : 'bg-white'} hover:bg-gray-50 text-gray-700`}>
                        <td className="p-3 border-r border-gray-100 whitespace-nowrap">{u.displayName || "-"}</td>
                        <td className="p-3 border-r border-gray-100 whitespace-nowrap font-medium text-gray-900">{u.username}</td>
                        <td className="p-3 border-r border-gray-100 whitespace-nowrap opacity-80">{u.displayPassword || u.username}</td>
                        <td className="p-3 border-r border-gray-100 text-center">{u.superCount || 0}</td>
                        <td className="p-3 border-r border-gray-100 text-center">{u.sellerCount || 0}</td>
                        <td className="p-3 border-r border-gray-100 text-center font-semibold">{u.totalKey || 0}</td>
                        <td className="p-3 border-r border-gray-100 text-center">{u.totalPaid || 0}</td>
                        <td className="p-3 border-r border-gray-100 text-center">{u.totalActive || 0}</td>
                        <td className="p-3 border-r border-gray-100 text-center">{u.todayCreated || 0}</td>
                        <td className="p-3 border-r border-gray-100 text-center">{u.todayPaid || 0}</td>
                        <td className="p-3 border-r border-gray-100 text-center font-bold text-gray-900">{u.paymentDue || 0}</td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex gap-1.5 items-center">
                            {/* Lock/Unlock - Orange border */}
                            <button
                              title="Change Password"
                              onClick={() => { setEditUser(u); setEditPassword(""); setEditMsg(""); }}
                              className="w-8 h-8 flex items-center justify-center border border-amber-400 rounded hover:bg-amber-50 transition-all text-amber-500 shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7h-4V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2H3a2 2 0 00-2 2v2h18v-2a2 2 0 00-2-2z" />
                              </svg>
                            </button>
                            {/* Cash/Money - Green Solid */}
                            {((myRole === "master_admin" && activeTab === "admin") ||
                              (myRole === "admin" && activeTab === "super") ||
                              (myRole === "super" && activeTab === "seller")) && (
                                <button
                                  title="Add Payment"
                                  onClick={() => {
                                    setPayUser(u);
                                    setPayAmount(u.paymentDue && u.paymentDue > 0 ? String(u.paymentDue) : "");
                                    setPayNote("");
                                    setPayMsg("");
                                  }}
                                  className="w-8 h-8 flex items-center justify-center bg-[#5cb85c] text-white rounded hover:bg-[#4cae4c] transition-all shadow-md"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </button>
                              )}
                            {/* Ban - Red border */}
                            <button
                              title={u.isActive ? "Deactivate" : "Activate"}
                              onClick={() => setDeactivateUser(u)}
                              className={`w-8 h-8 flex items-center justify-center border rounded transition-all shadow-sm ${u.isActive ? 'border-red-400 text-red-500 hover:bg-red-50' : 'bg-green-500 border-green-600 text-white'}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                            {/* Edit - Blue Solid */}
                            <button
                              title="Edit"
                              onClick={() => { setEditUser(u); setEditPassword(""); setEditMsg(""); }}
                              className="w-8 h-8 flex items-center justify-center bg-[#337ab7] text-white rounded hover:bg-[#286090] transition-all shadow-md"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination — matching standard style */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
              <div>Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * PER_PAGE + 1, filtered.length)} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries</div>
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 bg-gray-50 border-r border-gray-300 hover:bg-gray-100 disabled:opacity-50">Previous</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1 border-r border-gray-300 ${p === page ? "bg-[#337ab7] text-white font-bold" : "bg-gray-50 hover:bg-gray-100"}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="px-5 py-3 flex justify-between items-center text-[12px] text-gray-500 border-t border-gray-200 bg-white">
        <div>Copyright © 2026 <span className="text-[#337ab7] font-medium">AI Interface portal.</span> All rights reserved.</div>
        <div>Version 1.1</div>
      </footer>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-[15px] font-semibold text-gray-700">Edit Seller — {editUser.username}</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[12px] text-gray-600 mb-1">Username</label>
                <input value={editUser.username} disabled className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-[12px] text-gray-600 mb-1">Customer Name</label>
                <input
                  value={editUser.displayName}
                  onChange={e => setEditUser({ ...editUser, displayName: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[12px] text-gray-600 mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              {editMsg && (
                <div className={`text-[12px] px-3 py-2 rounded ${editMsg.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {editMsg}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="px-4 py-2 text-sm bg-[#4A90D9] text-white rounded hover:bg-[#3a7bc8] disabled:opacity-60">
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Received Payment Modal — Matching Snip 757 Perfectly */}
      {payUser && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex justify-center items-start pt-20 px-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-[480px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-[19px] font-normal text-[#333]">Add Received Payment</h2>
              <button
                onClick={() => setPayUser(null)}
                className="text-[#999] hover:text-[#333] text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-7">
              <input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded px-3 py-2 text-[18px] focus:outline-none focus:border-blue-500 shadow-sm"
              />

              {payMsg && (
                <div className={`mt-4 text-[13px] px-3 py-2 rounded ${payMsg.includes("added") || payMsg.includes("Payment") ? "bg-green-100 text-green-700 font-medium" : "bg-red-100 text-red-600 font-medium"}`}>
                  {payMsg}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-4 py-4 border-t border-gray-100">
              <button
                onClick={handlePaySave}
                disabled={paySaving || !payAmount}
                className="px-4 py-2 text-[15px] bg-[#3c8dbc] text-white rounded hover:bg-[#367fa9] font-medium transition-all shadow-sm disabled:opacity-50"
              >
                {paySaving ? "Adding..." : "Add Payment"}
              </button>
              <button
                onClick={() => setPayUser(null)}
                className="px-4 py-2 text-[15px] bg-[#dd4b39] text-white rounded hover:bg-[#d73925] font-medium transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Deactivate Modal — Matching Snip 890 */}
      {deactivateUser && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex justify-center items-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[480px] overflow-hidden p-8 flex flex-col items-center text-center">
            {/* Warning Icon */}
            <div className="w-20 h-20 rounded-full border-4 border-orange-200 flex items-center justify-center mb-6">
              <span className="text-4xl text-orange-400">!</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-700 mb-2">Are you sure?</h2>
            <p className="text-gray-500 mb-8 font-medium">You want to {deactivateUser.isActive ? "deactivate" : "activate"} this seller and all keys!</p>

            <div className="flex gap-3 w-full justify-center">
              <button
                onClick={() => setDeactivateUser(null)}
                className="px-8 py-2.5 bg-[#eee] text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-all border border-gray-300 min-w-[120px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleStatus(deactivateUser, "isActive", !deactivateUser.isActive)}
                disabled={actionSaving}
                className={`px-10 py-2.5 text-white rounded-md font-medium transition-all shadow-md min-w-[120px] ${deactivateUser.isActive ? 'bg-[#dd4b39] hover:bg-[#d73925]' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {actionSaving ? "Processing..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Ban Modal */}
      {banUser && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex justify-center items-center px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[480px] p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full border-4 border-amber-200 flex items-center justify-center mb-6 text-amber-500">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Ban User?</h2>
            <p className="text-gray-500 mb-8">Are you sure you want to {banUser.isBanned ? "unban" : "ban"} {banUser.username}?</p>
            <div className="flex gap-3 w-full justify-center">
              <button onClick={() => setBanUser(null)} className="px-8 py-2.5 bg-[#eee] text-gray-700 rounded-md border border-gray-300">Cancel</button>
              <button onClick={() => handleToggleStatus(banUser, "isBanned", !banUser.isBanned)} disabled={actionSaving} className="px-10 py-2.5 bg-amber-500 text-white rounded-md font-medium shadow-md">
                {actionSaving ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Deactivate Modal — Matching Snip 890 */}
      {deactivateUser && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex justify-center items-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[480px] overflow-hidden p-8 flex flex-col items-center text-center">
            {/* Warning Icon */}
            <div className="w-20 h-20 rounded-full border-4 border-orange-200 flex items-center justify-center mb-6">
              <span className="text-4xl text-orange-400">!</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-700 mb-2">Are you sure?</h2>
            <p className="text-gray-500 mb-8 font-medium italic">You want to {deactivateUser.isActive ? "deactivate" : "activate"} this seller and all keys!</p>

            <div className="flex gap-3 w-full justify-center">
              <button
                onClick={() => setDeactivateUser(null)}
                className="px-8 py-2.5 bg-[#eee] text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-all border border-gray-300 min-w-[120px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleStatus(deactivateUser, "isActive", !deactivateUser.isActive)}
                disabled={actionSaving}
                className={`px-10 py-2.5 text-white rounded-md font-medium transition-all shadow-md min-w-[120px] ${deactivateUser.isActive ? 'bg-[#dd4b39] hover:bg-[#d73925]' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {actionSaving ? "Processing..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Ban Modal */}
      {banUser && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex justify-center items-center px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[480px] p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full border-4 border-amber-200 flex items-center justify-center mb-6 text-amber-500">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Ban User?</h2>
            <p className="text-gray-500 mb-8">Are you sure you want to {banUser.isBanned ? "unban" : "ban"} {banUser.username}?</p>
            <div className="flex gap-3 w-full justify-center">
              <button onClick={() => setBanUser(null)} className="px-8 py-2.5 bg-[#eee] text-gray-700 rounded-md border border-gray-300">Cancel</button>
              <button onClick={() => handleToggleStatus(banUser, "isBanned", !banUser.isBanned)} disabled={actionSaving} className="px-10 py-2.5 bg-amber-500 text-white rounded-md font-medium shadow-md">
                {actionSaving ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
