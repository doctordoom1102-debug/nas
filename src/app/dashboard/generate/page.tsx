"use client";

import { useState } from "react";

export default function GeneratePage() {
  const [customerName, setCustomerName] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) { setError("Customer Name is required."); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 1,
          tier: "basic",
          expiresInDays: 30,
          notes: customerName.trim(),
          customKey: customKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setSuccess(`Key created: ${data.keys?.[0] || "OK"}`);
      setCustomerName("");
      setCustomKey("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9] text-gray-800">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
        <h1 className="text-xl font-light text-gray-700">Create Key</h1>
        <div className="text-sm text-[#337ab7]">
          Home <span className="text-gray-400 mx-1">/</span> Create Key
        </div>
      </div>

      <div className="p-5 flex-1">
        <div className="bg-white rounded shadow-sm">
          {/* Blue header */}
          <div className="bg-[#4A90D9] text-white px-4 py-2.5 rounded-t text-[14px] font-medium">
            Create Key
          </div>

          <div className="p-5 space-y-4">
            {/* Red warning */}
            <div className="bg-[#D9534F] text-white px-4 py-3 rounded text-[13px]">
              Dear Seller :- Free ID creation stop kar diya hai, Ab se sirf unpaid ID create hogi jo aap ko apne super seller se paid karvani hogi.
            </div>

            {/* Error / Success */}
            {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-2 rounded text-sm">{success}</div>}

            <form onSubmit={handleCreate}>
              {/* 2-column row */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Key (optional)</label>
                  <input
                    type="text"
                    value={customKey}
                    onChange={e => setCustomKey(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Uses Customer Name if empty"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#4A90D9] text-white text-[13px] rounded hover:bg-[#3a7bc8] transition-colors disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-5 py-3 flex justify-between items-center text-[12px] text-gray-500 border-t border-gray-200 bg-white">
        <div>Copyright © 2026 <span className="text-[#337ab7] font-medium">AI Interface portal.</span> All rights reserved.</div>
        <div>Version 1.1</div>
      </footer>
    </div>
  );
}
