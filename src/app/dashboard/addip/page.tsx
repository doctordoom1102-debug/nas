"use client";

import { useState } from "react";

export default function AddIPPage() {
    const [ip, setIp] = useState("");
    const [label, setLabel] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ip.trim()) { setError("IP address is required."); return; }
        setLoading(true); setError(""); setSuccess("");
        // Placeholder — connect to your IP whitelist API
        setTimeout(() => {
            setSuccess(`IP ${ip} added successfully.`);
            setIp(""); setLabel("");
            setLoading(false);
        }, 800);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F6F9] text-gray-800">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
                <h1 className="text-xl font-light text-gray-700">Add IP</h1>
                <div className="text-sm text-[#337ab7]">Home <span className="text-gray-400 mx-1">/</span> Add IP</div>
            </div>

            <div className="p-5 flex-1">
                <div className="bg-white rounded shadow-sm">
                    <div className="bg-[#4A90D9] text-white px-4 py-2.5 rounded-t text-[14px] font-medium">Add IP</div>
                    <div className="p-5 space-y-4">
                        {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}
                        {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-2 rounded text-sm">{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">IP Address</label>
                                    <input type="text" value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.1"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Label (optional)</label>
                                    <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Office Server"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <button type="submit" disabled={loading}
                                    className="px-5 py-2 bg-[#4A90D9] text-white text-[13px] rounded hover:bg-[#3a7bc8] transition-colors disabled:opacity-60">
                                    {loading ? "Adding..." : "Add IP"}
                                </button>
                            </div>
                        </form>
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
