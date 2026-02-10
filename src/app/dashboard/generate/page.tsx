"use client";

import { useState } from "react";

export default function GeneratePage() {
  const [count, setCount] = useState(1);
  const [tier, setTier] = useState("basic");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [notes, setNotes] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count,
        tier,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
        notes,
      }),
    });

    const data = await res.json();
    setGeneratedKeys(data.keys || []);
    setLoading(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(generatedKeys.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Generate Access Keys</h1>

      <form onSubmit={generate} className="space-y-4 bg-[#111B33] rounded-xl border border-[#1C2B4A] p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#7B8FB5] mb-1">Count</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-[#7B8FB5] mb-1">Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full px-4 py-2 rounded-lg text-sm">
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="ultimate">Ultimate</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#7B8FB5] mb-1">Expires in (days) — leave empty for lifetime</label>
          <input
            type="number"
            min={1}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            placeholder="e.g. 30"
            className="w-full px-4 py-2 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-[#7B8FB5] mb-1">Mission Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Batch for Team Alpha"
            className="w-full px-4 py-2 rounded-lg text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#105BD8] hover:bg-[#2B7AE8] text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Deploying..." : `Deploy ${count} Key${count > 1 ? "s" : ""}`}
        </button>
      </form>

      {generatedKeys.length > 0 && (
        <div className="mt-6 bg-[#111B33] rounded-xl border border-[#1C2B4A] p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Deployed Keys ({generatedKeys.length})</h2>
            <button
              onClick={copyAll}
              className="px-4 py-1.5 bg-[#1C2B4A] hover:bg-[#105BD8]/30 text-white rounded-lg text-sm transition"
            >
              {copied ? "Copied!" : "Copy All"}
            </button>
          </div>
          <div className="space-y-1 font-mono text-sm max-h-80 overflow-auto">
            {generatedKeys.map((k, i) => (
              <div
                key={i}
                className="px-3 py-2 bg-[#0B1026] rounded cursor-pointer hover:bg-[#1C2B4A] select-all"
                onClick={() => navigator.clipboard.writeText(k)}
              >
                {k}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
