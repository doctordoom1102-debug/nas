"use client";

import { useEffect, useState, useRef } from "react";

interface PaymentRecord {
    _id: string;
    targetKey: string;
    action: string;
    amount: number;
    details: string;
    createdAt: string;
    performedBy?: { username: string; role: string } | null;
    targetUser?: { username: string; role: string } | null;
}

interface Seller {
    _id: string;
    username: string;
    displayName: string;
}

export default function PaymentHistoryPage() {
    const [records, setRecords] = useState<PaymentRecord[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [myRole, setMyRole] = useState("");
    const [myId, setMyId] = useState("");
    const [selectedSeller, setSelectedSeller] = useState("self");
    const [sellerSearch, setSellerSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"super" | "seller">("super");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => {
            setMyRole(d.role);
            setMyId(d.userId || d._id || "");
            if (d.role === "super") {
                setActiveTab("seller");
            } else {
                setActiveTab("super");
            }
        });
    }, []);

    useEffect(() => {
        if (!myRole) return;
        setSelectedSeller("self");
        fetchPayments("self");
        if (myRole === "super" || myRole === "admin" || myRole === "master_admin") {
            fetch(`/api/admin/users?role=${activeTab}`)
                .then(r => r.json())
                .then(d => setSellers(d.users || []));
        }
    }, [myRole, activeTab]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const fetchPayments = async (sellerVal: string) => {
        setLoading(true);
        try {
            const url = sellerVal === "self"
                ? "/api/admin/history?type=payment"
                : `/api/admin/history?type=payment&sellerId=${sellerVal}`;
            const res = await fetch(url);
            const d = await res.json();
            setRecords(d.records || []);
        } catch {
            setRecords([]);
        }
        setLoading(false);
    };

    const handleSelectSeller = (val: string) => {
        setSelectedSeller(val);
        setDropdownOpen(false);
        setSellerSearch("");
        setPage(1);
        fetchPayments(val);
    };

    const isSuper = myRole === "super";
    const isAdmin = myRole === "admin" || myRole === "master_admin";
    const showSellerDropdown = isSuper || isAdmin;

    const filtered = records.filter(r =>
        (r.targetKey || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const fmtDate = (d: string) => {
        const dt = new Date(d);
        return dt.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }) +
            " " + dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
    };

    const selectedLabel = selectedSeller === "self"
        ? "Self Payment History"
        : sellers.find(s => s._id === selectedSeller)?.username || "Self Payment History";

    const filteredSellerList = sellers.filter(s =>
        s.username.toLowerCase().includes(sellerSearch.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F6F9] text-gray-800">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
                <h1 className="text-xl font-light text-gray-700">Payment History</h1>
                <div className="text-sm text-[#337ab7]">Home <span className="text-gray-400 mx-1">/</span> Payment History</div>
            </div>

            <div className="p-5 flex-1">
                <div className="bg-white rounded shadow-sm">
                    <div className="p-3 border-b border-gray-100 text-[14px] text-gray-700">Payment History</div>
                    <div className="p-4">
                        {/* Admin role tab toggle */}
                        {isAdmin && (
                            <div className="flex items-center gap-4 text-sm font-bold mb-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="radio" name="phr" checked={activeTab === "super"} onChange={() => setActiveTab("super")} className="accent-[#d9534f]" />
                                    Super Seller
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="radio" name="phr" checked={activeTab === "seller"} onChange={() => setActiveTab("seller")} className="accent-[#d9534f]" />
                                    Seller
                                </label>
                            </div>
                        )}

                        {/* Seller Selector Dropdown */}
                        {showSellerDropdown && (
                            <div className="mb-4 relative w-72" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-full flex items-center justify-between border border-gray-300 rounded px-3 py-2 text-sm bg-white hover:border-gray-400 text-gray-700"
                                >
                                    <span>{selectedLabel}</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 shadow-lg mt-0.5 rounded-b">
                                        <div className="p-1 border-b border-gray-100">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={sellerSearch}
                                                onChange={e => setSellerSearch(e.target.value)}
                                                className="w-full border border-blue-400 px-2 py-1 text-sm focus:outline-none"
                                                placeholder="Search..."
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            <div
                                                onClick={() => handleSelectSeller("self")}
                                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${selectedSeller === "self" ? "bg-[#4A90D9] text-white font-medium" : ""}`}
                                            >
                                                Self Payment History
                                            </div>
                                            {filteredSellerList.map(s => (
                                                <div
                                                    key={s._id}
                                                    onClick={() => handleSelectSeller(s._id)}
                                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${selectedSeller === s._id ? "bg-blue-50 font-medium" : ""}`}
                                                >
                                                    {s.username}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                            <div className="flex flex-wrap gap-1">
                                {["Copy", "CSV", "Excel", "PDF", "Print"].map(b => (
                                    <button key={b} className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268]">{b}</button>
                                ))}
                                <button className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268] flex items-center gap-1">
                                    Column visibility <span className="text-[10px]">▼</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] text-gray-600">Search:</span>
                                <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-44" />
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-gray-200">
                            <table className="w-full text-[13px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f8f9fa] border-b border-gray-200">
                                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7]">Payment ↕</th>
                                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7]">Message ↕</th>
                                        <th className="p-2.5 font-bold text-[#337ab7]">Date +</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={3} className="p-10 text-center animate-pulse text-gray-400">Loading...</td></tr>
                                    ) : paged.length === 0 ? (
                                        <tr><td colSpan={3} className="p-10 text-center italic text-gray-400">No payment records found.</td></tr>
                                    ) : (
                                        paged.map((r, i) => {
                                            const isPaidAction = r.action === "paid";
                                            const isSeller = myRole === "seller";

                                            let msg = "";
                                            let amountColor = "text-gray-700";

                                            if (isPaidAction) {
                                                if (isSeller) {
                                                    // I am the seller, I paid money to my super/admin
                                                    msg = `Paid to ${r.performedBy?.username || "Admin"}`;
                                                    amountColor = "text-red-500";
                                                } else {
                                                    // I am the admin, I received money from this seller
                                                    msg = `Received from ${r.targetUser?.username || "Seller"}`;
                                                    amountColor = "text-green-600";
                                                }
                                            } else {
                                                msg = `Key Activation - ${r.targetKey}`;
                                                amountColor = "text-red-500";
                                            }

                                            return (
                                                <tr key={r._id} className={i % 2 === 1 ? "bg-[#fcfcfc]" : ""}>
                                                    <td className={`p-2.5 border-r border-gray-100 font-bold ${amountColor}`}>
                                                        {isPaidAction && !isSeller ? "+" : "-"}{r.amount || 2400}
                                                    </td>
                                                    <td className="p-2.5 border-r border-gray-100 text-gray-600 font-medium whitespace-nowrap">
                                                        {msg}
                                                    </td>
                                                    <td className="p-2.5 text-gray-500 text-xs">
                                                        {fmtDate(r.createdAt)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                            <div>Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * PER_PAGE + 1, filtered.length)} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries</div>
                            <div className="flex border border-gray-300 rounded overflow-hidden">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="px-3 py-1 bg-gray-50 border-r border-gray-300 hover:bg-gray-100 disabled:opacity-50">Previous</button>
                                {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`px-3 py-1 border-r border-gray-300 ${p === page ? "bg-[#4A90D9] text-white font-bold" : "bg-gray-50 hover:bg-gray-100"}`}>{p}</button>
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
        </div>
    );
}
