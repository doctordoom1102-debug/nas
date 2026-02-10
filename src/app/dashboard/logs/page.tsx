"use client";

import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.recentLogs || []);
        setLoading(false);
      });
  }, []);

  const actionColor: Record<string, string> = {
    validate_success: "bg-green-500/20 text-green-400",
    validate_expired: "bg-yellow-500/20 text-yellow-400",
    validate_banned: "bg-red-500/20 text-red-400",
    hwid_bound: "bg-[#105BD8]/20 text-[#2B7AE8]",
    hwid_mismatch: "bg-orange-500/20 text-orange-400",
    hwid_reset: "bg-[#00B4D8]/20 text-[#00B4D8]",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Flight Log</h1>

      <div className="bg-[#111B33] rounded-xl border border-[#1C2B4A] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1C2B4A] text-[#7B8FB5]">
              <th className="text-left p-3">Timestamp</th>
              <th className="text-left p-3">Key</th>
              <th className="text-left p-3">Event</th>
              <th className="text-left p-3">HWID</th>
              <th className="text-left p-3">Origin IP</th>
              <th className="text-left p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-[#7B8FB5]">Loading flight data...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-[#7B8FB5]">No flight data recorded</td></tr>
            ) : (
              logs.map((log, i) => (
                <tr key={i} className="border-b border-[#1C2B4A]/50 hover:bg-[#1C2B4A]/30">
                  <td className="p-3 text-[#7B8FB5] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{log.licenseKey}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${actionColor[log.action] || "bg-gray-500/20 text-gray-400"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-[#7B8FB5]">{log.hwid ? log.hwid.substring(0, 12) + "..." : "---"}</td>
                  <td className="p-3 font-mono text-xs text-[#7B8FB5]">{log.ip || "---"}</td>
                  <td className="p-3 text-[#7B8FB5] text-xs">{log.details || "---"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
