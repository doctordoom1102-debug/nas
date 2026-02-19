"use client";

import { useEffect, useState, useRef } from "react";

interface RenewRecord {
    _id: string;
    key: string;
    notes: string;
    createdAt: string;
    expiresAt: string | null;
    approvedAt: string | null;
    approvedBy: { username: string } | null;
    createdBy?: { username: string } | null;
}

interface Seller {
    _id: string;
    username: string;
    displayName: string;
}

export default function PaidRenewHistoryPage() {
    const [records, setRecords] = useState<RenewRecord[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [selectedSeller, setSelectedSeller] = useState("all");
    const [sellerSearch, setSellerSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [myRole, setMyRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => setMyRole(d.role));
        fetch("/api/admin/history?type=paid")
            .then(r => r.json())
            .then(d => { setRecords(d.records || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (myRole === "super") {
            fetch("/api/admin/users?role=seller")
                .then(r => r.json())
                .then(d => setSellers(d.users || []));
        } else if (myRole === "admin" || myRole === "master_admin") {
            fetch("/api/admin/users?role=seller")
                .then(r => r.json())
                .then(d => setSellers(d.users || []));
        }
    }, [myRole]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const isSuper = myRole === "super";
    const isAdmin = myRole === "admin" || myRole === "master_admin";
    const showSellerFilter = isSuper || isAdmin;

    const fmtDateSearch = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB").replace(/\//g, "/") : "";

    const filteredRecords = records.filter(r => {
        const search = searchTerm.toLowerCase();
        const dateStr = fmtDateSearch(r.createdAt).toLowerCase();
        const expireStr = fmtDateSearch(r.expiresAt).toLowerCase();
        const paidStr = fmtDateSearch(r.approvedAt || r.createdAt).toLowerCase();

        const matchSearch =
            r.key.toLowerCase().includes(search) ||
            (r.notes || "").toLowerCase().includes(search) ||
            dateStr.includes(search) ||
            expireStr.includes(search) ||
            paidStr.includes(search);

        if (!showSellerFilter || selectedSeller === "all") return matchSearch;
        const sellerUsername = sellers.find(s => s._id === selectedSeller)?.username || "";
        const createdByUsername = (r.createdBy as any)?.username || "";
        return matchSearch && createdByUsername === sellerUsername;
    });

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PER_PAGE));
    const paged = filteredRecords.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB").replace(/\//g, "/") : "—";

    const selectedSellerLabel = selectedSeller === "all"
        ? "All"
        : sellers.find(s => s._id === selectedSeller)?.username || "All";

    const filteredSellerList = sellers.filter(s =>
        s.username.toLowerCase().includes(sellerSearch.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F6F9] text-gray-800">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
                <h1 className="text-xl font-light text-gray-700">Key Paid &amp; Renew History</h1>
                <div className="text-sm text-[#337ab7]">Home <span className="text-gray-400 mx-1">/</span> Key Paid &amp; Renew History</div>
            </div>

            <div className="p-5 flex-1">
                <div className="bg-white rounded shadow-sm">
                    <div className="p-3 border-b border-gray-100 text-[14px] text-gray-700">Key Paid &amp; Renew History</div>
                    <div className="p-4">

                        {/* Seller Filter Dropdown */}
                        {showSellerFilter && (
                            <div className="mb-4 relative w-72" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-full flex items-center justify-between border border-gray-300 rounded px-3 py-2 text-sm bg-white hover:border-gray-400 text-gray-700"
                                >
                                    <span>{selectedSellerLabel}</span>
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
                                                onClick={() => { setSelectedSeller("all"); setSellerSearch(""); setDropdownOpen(false); setPage(1); }}
                                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${selectedSeller === "all" ? "bg-[#4A90D9] text-white font-medium" : ""}`}
                                            >
                                                All
                                            </div>
                                            {filteredSellerList.map(s => (
                                                <div
                                                    key={s._id}
                                                    onClick={() => { setSelectedSeller(s._id); setSellerSearch(""); setDropdownOpen(false); setPage(1); }}
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
                                    <button key={b}
                                        onClick={b === "Copy" ? () => navigator.clipboard.writeText(paged.map(r => r.key).join("\n")) : () => window.print()}
                                        className="px-3 py-1.5 bg-[#6c757d] text-white text-[12px] rounded hover:bg-[#5a6268]">{b}</button>
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

                        {/* Table */}
                        <div className="overflow-x-auto border border-gray-200">
                            <table className="w-full text-[13px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f8f9fa] border-b border-gray-200">
                                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7]">Key ↕</th>
                                        {showSellerFilter && <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7]">Seller ↕</th>}
                                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7]">Customer ↕</th>
                                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7]">Added Date ↕</th>
                                        <th className="p-2.5 border-r border-gray-200 font-bold text-[#337ab7]">Expire Date ↕</th>
                                        <th className="p-2.5 font-bold text-[#337ab7]">Paid Date ↕</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={showSellerFilter ? 6 : 5} className="p-10 text-center animate-pulse text-gray-400">Loading...</td></tr>
                                    ) : paged.length === 0 ? (
                                        <tr><td colSpan={showSellerFilter ? 6 : 5} className="p-10 text-center italic text-gray-400">No records found.</td></tr>
                                    ) : (
                                        paged.map((r, i) => (
                                            <tr key={r._id} className={i % 2 === 1 ? "bg-[#fcfcfc]" : ""}>
                                                <td className="p-2.5 border-r border-gray-100 font-mono text-xs font-bold text-gray-700">{r.key}</td>
                                                {showSellerFilter && (
                                                    <td className="p-2.5 border-r border-gray-100 text-gray-600">
                                                        {(r.createdBy as any)?.username || "—"}
                                                    </td>
                                                )}
                                                <td className="p-2.5 border-r border-gray-100 text-gray-600">{r.notes || "—"}</td>
                                                <td className="p-2.5 border-r border-gray-100 text-gray-600">{fmt(r.createdAt)}</td>
                                                <td className="p-2.5 border-r border-gray-100 text-gray-600">{fmt(r.expiresAt)}</td>
                                                <td className="p-2.5 text-gray-600">{fmt(r.approvedAt || r.createdAt)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                            <div>Showing {filteredRecords.length === 0 ? 0 : Math.min((page - 1) * PER_PAGE + 1, filteredRecords.length)} to {Math.min(page * PER_PAGE, filteredRecords.length)} of {filteredRecords.length} entries</div>
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
