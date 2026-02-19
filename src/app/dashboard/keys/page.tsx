"use client";

import { useEffect, useState, useRef } from "react";

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

interface Seller {
  _id: string;
  username: string;
  displayName: string;
  role: string;
}

function getRemainingDays(expiresAt: string | null): number {
  if (!expiresAt) return 999;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function KeysPage() {
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<"super" | "seller" | "admin" | "all">("super");
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [sellerSearch, setSellerSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColModal, setShowColModal] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [cols, setCols] = useState({
    customer: true,
    key: true,
    remainingDays: true,
    active: true,
    ip: true,
    paid: true,
    action: true,
  });

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setUserRole(d.role);
      setUserId(d.userId || d._id || "");
      if (d.role === "seller") {
        fetchKeys(d.userId || d._id || "");
      } else if (d.role === "super") {
        setActiveTab("seller");
      } else if (d.role === "admin" || d.role === "master_admin") {
        setActiveTab("super");
      }
    });
  }, []);

  useEffect(() => {
    if (userRole && userRole !== "seller") {
      setSelectedSeller(null);
      setKeys([]);
      fetchSellers(activeTab);
    }
  }, [activeTab, userRole]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchSellers = async (role: string) => {
    const res = await fetch(`/api/admin/users?role=${role}`);
    const data = await res.json();
    setSellers(data.users || []);
  };

  const fetchKeys = async (sellerId: string) => {
    if (!sellerId) { setKeys([]); return; }
    setLoading(true);
    const res = await fetch(`/api/admin/keys?createdBy=${sellerId}`);
    const data = await res.json();
    setKeys(data.keys || []);
    setLoading(false);
  };

  const handleSelectSeller = (s: Seller) => {
    setSelectedSeller(s);
    setSellerSearch("");
    setDropdownOpen(false);
    fetchKeys(s._id);
    setPage(1);
  };

  const updateKey = async (id: string, updates: any) => {
    await fetch(`/api/admin/keys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchKeys(userRole === "seller" ? userId : (selectedSeller?._id || ""));
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Delete this key?")) return;
    await fetch(`/api/admin/keys/${id}`, { method: "DELETE" });
    fetchKeys(userRole === "seller" ? userId : (selectedSeller?._id || ""));
  };

  const resetHwid = async (key: LicenseKey) => {
    if (!key.hwid) return;
    if (!confirm(`Do you want to reset MAC for ${key.key}? (${key.hwidResetsUsed || 0}/${key.maxHwidResets || 3} used)`)) return;
    const res = await fetch(`/api/admin/keys/${key._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetHwid: true }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Failed to reset MAC");
    fetchKeys(userRole === "seller" ? userId : (selectedSeller?._id || ""));
  };

  const renewKey = async (key: LicenseKey) => {
    if (!confirm(`Do you want to renew this key? It will become unpaid until approved, and validity will be extended by 30 days from payment.`)) return;
    await fetch(`/api/admin/keys/${key._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ renew: true }),
    });
    fetchKeys(userRole === "seller" ? userId : (selectedSeller?._id || ""));
  };

  const editKeyNotes = async (key: LicenseKey) => {
    const newNotes = prompt("Enter new Customer Name (Notes):", key.notes);
    if (newNotes === null) return;
    await updateKey(key._id, { notes: newNotes });
  };

  const isSeller = userRole === "seller";
  const isAdminRole = userRole === "admin" || userRole === "master_admin";
  const hasSelection = isSeller || !!selectedSeller;

  const filtered = keys.filter(k => {
    const s = searchTerm.toLowerCase();
    const remaining = getRemainingDays(k.expiresAt).toString();
    const isActive = k.status === "active" ? "yes" : "no";
    const isPaid = k.approvedBy ? "yes" : "no";

    return k.key.toLowerCase().includes(s) ||
      (k.notes || "").toLowerCase().includes(s) ||
      remaining.includes(s) ||
      isActive.includes(s) ||
      isPaid.includes(s);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const filteredSellerList = sellers.filter(s =>
    s.username.toLowerCase().includes(sellerSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9] text-gray-800">
      {/* Top bar matching Snip 894 */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm min-h-[50px]">
        <h1 className="text-2xl font-light text-gray-700">View Keys</h1>
        <div className="text-sm">
          <span className="text-[#337ab7]">Home</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-gray-500">View Keys</span>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-auto custom-scrollbar">
        <div className="bg-white rounded shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 text-[14px] text-gray-700">
            View Keys
          </div>
          <div className="p-4 space-y-4">

            {/* Role filter + Dropdown row — matching Snip 894 */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {isAdminRole && (
                <div className="flex items-center gap-4 text-[13px] font-bold text-gray-700">
                  {userRole === "master_admin" && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="kr" checked={activeTab === "admin"} onChange={() => setActiveTab("admin")} className="accent-[#d9534f] w-4 h-4" />
                      <span>Mini Admin</span>
                    </label>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="kr" checked={activeTab === "super"} onChange={() => setActiveTab("super")} className="accent-[#d9534f] w-4 h-4" />
                    <span>Super Seller</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="kr" checked={activeTab === "seller"} onChange={() => setActiveTab("seller")} className="accent-[#d9534f] w-4 h-4" />
                    <span>Seller</span>
                  </label>
                  {userRole === "master_admin" && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="kr" checked={activeTab === "all"} onChange={() => setActiveTab("all")} className="accent-[#d9534f] w-4 h-4" />
                      <span>All</span>
                    </label>
                  )}
                </div>
              )}

              {/* Seller Dropdown — refined to match snippet */}
              {!isSeller && (
                <div className="relative w-full max-w-xl" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 hover:border-gray-300 focus:outline-none rounded transition-colors"
                  >
                    <span className={selectedSeller ? "text-gray-800 font-medium" : "text-gray-400 text-[13px]"}>
                      {selectedSeller ? selectedSeller.username : "Select Seller"}
                    </span>
                    <svg className="w-3 h-3 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-100 shadow-xl mt-1 rounded py-0 overflow-hidden">
                      <div className="p-1.5 border-b border-gray-50 bg-gray-50/50">
                        <input
                          autoFocus
                          type="text"
                          value={sellerSearch}
                          onChange={e => setSellerSearch(e.target.value)}
                          className="w-full border border-blue-400/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 ring-blue-100 rounded"
                          placeholder="Type to search..."
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <div
                          onClick={() => { setSelectedSeller(null); setSellerSearch(""); setDropdownOpen(false); setKeys([]); }}
                          className={`px-4 py-2.5 text-[13px] cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors ${!selectedSeller ? "bg-[#337ab7] text-white hover:bg-[#286090]" : "text-gray-500"}`}
                        >
                          Select Seller
                        </div>
                        {filteredSellerList.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-xs italic">No entries found</div>
                        ) : (
                          filteredSellerList.map(s => (
                            <div
                              key={s._id}
                              onClick={() => handleSelectSeller(s)}
                              className={`px-4 py-2.5 text-[13px] cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${selectedSeller?._id === s._id ? "bg-blue-50 text-[#337ab7] font-semibold" : "text-gray-600"}`}
                            >
                              {s.username}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Table controls + table — shown after seller selected or for seller role */}
            {hasSelection && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Controls row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                  <div className="flex flex-wrap gap-1 relative">
                    <button
                      onClick={() => navigator.clipboard.writeText(paged.map(k => k.key).join("\n"))}
                      className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268]"
                    >Copy</button>
                    <button className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268]">CSV</button>
                    <button className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268]">Excel</button>
                    <button onClick={() => window.print()} className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268]">PDF</button>
                    <button onClick={() => window.print()} className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268]">Print</button>
                    <div className="relative">
                      <button
                        onClick={() => setShowColModal(!showColModal)}
                        className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268] flex items-center gap-1"
                      >
                        Column visibility <span className="text-[10px]">▼</span>
                      </button>
                      {showColModal && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-50 py-1 w-44 text-left text-gray-700">
                          {Object.keys(cols).map(k => (
                            <div
                              key={k}
                              onClick={() => setCols({ ...cols, [k]: !(cols as any)[k] })}
                              className={`px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-[12px] ${!(cols as any)[k] ? "opacity-40" : "font-semibold"}`}
                            >
                              {k === "remainingDays" ? "Remaining Days" : k.charAt(0).toUpperCase() + k.slice(1)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-gray-600">Search:</span>
                    <input
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-44"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-200">
                  <table className="w-full text-[13px] text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200">
                        {cols.customer && (
                          <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] whitespace-nowrap">
                            Customer <span className="text-gray-400 text-[10px]">↕</span>
                          </th>
                        )}
                        {cols.key && (
                          <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] whitespace-nowrap">
                            Key <span className="text-gray-400 text-[10px]">↕</span>
                          </th>
                        )}
                        {isAdminRole && (
                          <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] whitespace-nowrap">
                            Seller <span className="text-gray-400 text-[10px]">↕</span>
                          </th>
                        )}
                        {cols.remainingDays && (
                          <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] text-center whitespace-nowrap">
                            Remaining Days <span className="text-gray-400 text-[10px]">+</span>
                          </th>
                        )}
                        {cols.active && (
                          <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] text-center whitespace-nowrap">
                            Active <span className="text-gray-400 text-[10px]">↕</span>
                          </th>
                        )}
                        {cols.ip && (
                          <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] text-center whitespace-nowrap">
                            IP <span className="text-gray-400 text-[10px]">↕</span>
                          </th>
                        )}
                        {cols.paid && (
                          <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7] text-center whitespace-nowrap">
                            Paid <span className="text-gray-400 text-[10px]">↕</span>
                          </th>
                        )}
                        {cols.action && (
                          <th className="p-2.5 font-bold text-[#337ab7] whitespace-nowrap">
                            Action <span className="text-gray-400 text-[10px]">↕</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan={isAdminRole ? 8 : 7} className="p-10 text-center animate-pulse text-gray-400">Loading...</td>
                        </tr>
                      ) : paged.length === 0 ? (
                        <tr>
                          <td colSpan={isAdminRole ? 8 : 7} className="p-10 text-center italic text-gray-400">No keys found for this selection.</td>
                        </tr>
                      ) : (
                        paged.map((k, i) => {
                          const isPaid = !!k.approvedBy;
                          const isActive = k.status === "active";
                          const isBanned = k.status === "banned";
                          const isDemo = k.tier === "demo" || k.notes === "FREE_DEMO";
                          const remaining = getRemainingDays(k.expiresAt);
                          const isSeller = userRole === "seller";

                          return (
                            <tr key={k._id} className={`${i % 2 === 1 ? "bg-[#fcfcfc]" : ""} hover:bg-gray-50`}>
                              {/* Customer */}
                              {cols.customer && (
                                <td className="p-2.5 border-r border-gray-100 font-medium text-gray-700 whitespace-nowrap">
                                  {k.notes || "—"}
                                </td>
                              )}
                              {/* Key — green for monthly, red for demo */}
                              {cols.key && (
                                <td className="p-2.5 border-r border-gray-100 whitespace-nowrap">
                                  <span className={`font-mono text-xs font-bold ${isDemo ? "text-red-500" : "text-green-600"}`}>
                                    {k.key}
                                  </span>
                                </td>
                              )}
                              {isAdminRole && (
                                <td className="p-2.5 border-r border-gray-100 whitespace-nowrap text-gray-600">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">{k.createdBy?.username || "-"}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{k.createdBy?.role}</span>
                                  </div>
                                </td>
                              )}
                              {/* Remaining Days */}
                              {cols.remainingDays && (
                                <td className="p-2.5 border-r border-gray-100 text-center text-gray-700">
                                  {remaining === 999 ? "∞" : remaining}
                                </td>
                              )}
                              {/* Active */}
                              {cols.active && (
                                <td className="p-2.5 border-r border-gray-100 text-center">
                                  <span className={`font-medium ${isActive ? "text-green-600" : "text-red-500"}`}>
                                    {isActive ? "Yes" : "No"}
                                  </span>
                                </td>
                              )}
                              {/* IP */}
                              {cols.ip && (
                                <td className="p-2.5 border-r border-gray-100 text-center text-gray-500">
                                  {k.lastUsedIp || 0}
                                </td>
                              )}
                              {/* Paid */}
                              {cols.paid && (
                                <td className="p-2.5 border-r border-gray-100 text-center">
                                  <span className={`font-medium ${isPaid ? "text-green-600" : "text-red-500"}`}>
                                    {isPaid ? "Yes" : "No"}
                                  </span>
                                </td>
                              )}
                              {/* Action */}
                              {cols.action && (
                                <td className="p-2.5 whitespace-nowrap">
                                  <div className="flex gap-2 items-center">
                                    {/* Red square with X circle icon — Deactivate/Ban */}
                                    <button
                                      title={isBanned ? "Activate" : "Deactivate"}
                                      onClick={() => {
                                        const action = isBanned ? "activate" : "deactivate";
                                        if (confirm(`Do you want to ${action} this key?`)) {
                                          updateKey(k._id, { status: isBanned ? "active" : "banned" });
                                        }
                                      }}
                                      className={`w-7 h-7 flex items-center justify-center border rounded transition-colors bg-white shadow-sm ${isBanned ? "border-green-500 text-green-500 hover:bg-green-50" : "border-red-500 text-red-500 hover:bg-red-50"}`}
                                    >
                                      {isBanned ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                    </button>

                                    {/* Blue square with refresh icon — Reset MAC (if assigned) */}
                                    {k.hwid && (
                                      <button
                                        title="Reset MAC (HWID)"
                                        onClick={() => resetHwid(k)}
                                        className="w-7 h-7 flex items-center justify-center border border-blue-500 rounded text-blue-500 hover:bg-blue-50 transition-colors bg-white shadow-sm"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                      </button>
                                    )}

                                    {/* Renew Key (Shown as Green Cart for Seller if < 5 days remaining) */}
                                    {isSeller && remaining < 5 && (
                                      <button
                                        title="Renew Key"
                                        onClick={() => renewKey(k)}
                                        className="w-7 h-7 flex items-center justify-center border border-green-500 rounded text-green-600 hover:bg-green-50 transition-colors bg-white shadow-sm"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                      </button>
                                    )}

                                    {/* Blue square with pencil icon — Edit */}
                                    <button
                                      title="Edit Key"
                                      onClick={() => editKeyNotes(k)}
                                      className="w-7 h-7 flex items-center justify-center border border-blue-400 rounded text-blue-500 hover:bg-blue-50 transition-colors bg-white shadow-sm"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>

                                    {/* Green cart icon — Master: only when viewing Super tab; Admin: never */}
                                    {!isPaid && !isSeller && userRole !== "admin" && (userRole !== "master_admin" || activeTab === "super") && (
                                      <button
                                        title="Approve / Mark Paid"
                                        onClick={() => {
                                          if (confirm("Do you want to paid this key?")) {
                                            updateKey(k._id, { approve: true });
                                          }
                                        }}
                                        className="w-7 h-7 flex items-center justify-center border border-green-500 rounded text-green-600 hover:bg-green-50 transition-colors bg-white shadow-sm"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
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
                    Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * PER_PAGE + 1, filtered.length)} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
                  </div>
                  <div className="flex border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-gray-50 border-r border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                    >Previous</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 border-r border-gray-300 ${p === page ? "bg-[#4A90D9] text-white font-bold" : "bg-gray-50 hover:bg-gray-100"}`}
                      >{p}</button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                    >Next</button>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      <footer className="px-5 py-3 flex justify-between items-center text-[12px] text-gray-500 border-t border-gray-200 bg-white">
        <div>Copyright © 2026 <span className="text-[#337ab7] font-medium">AI Interface portal.</span> All rights reserved.</div>
        <div>Version 1.1</div>
      </footer>
    </div>
  );
}
