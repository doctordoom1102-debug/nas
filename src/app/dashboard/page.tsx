"use client";

import { useEffect, useState } from "react";

interface Stats {
  total: number;
  active: number;
  expired: number;
  banned: number;
  inactive: number;
  validationsToday: number;
  recentLogs: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="text-[#7B8FB5]">Loading telemetry...</div>;

  const cards = [
    { label: "Total Keys", value: stats.total, color: "text-white", icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" },
    { label: "Active", value: stats.active, color: "text-green-400", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Expired", value: stats.expired, color: "text-yellow-400", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Banned", value: stats.banned, color: "text-red-400", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
    { label: "Inactive", value: stats.inactive, color: "text-gray-400", icon: "M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" },
    { label: "Validations (24h)", value: stats.validationsToday, color: "text-[#00B4D8]", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Mission Control</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#111B33] rounded-xl p-4 border border-[#1C2B4A] hover:border-[#105BD8]/30 transition">
            <div className="flex items-center gap-2 mb-2">
              <svg className={`w-4 h-4 ${c.color} opacity-60`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
              </svg>
              <p className="text-xs text-[#7B8FB5]">{c.label}</p>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-white mb-3">Recent Transmissions</h2>
      <div className="bg-[#111B33] rounded-xl border border-[#1C2B4A] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1C2B4A] text-[#7B8FB5]">
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">Key</th>
              <th className="text-left p-3">Action</th>
              <th className="text-left p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentLogs.map((log: any, i: number) => (
              <tr key={i} className="border-b border-[#1C2B4A]/50 hover:bg-[#1C2B4A]/30">
                <td className="p-3 text-[#7B8FB5]">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-3 font-mono text-xs">{log.licenseKey}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      log.action.includes("success")
                        ? "bg-green-500/20 text-green-400"
                        : log.action.includes("banned")
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="p-3 text-[#7B8FB5] font-mono text-xs">{log.ip}</td>
              </tr>
            ))}
            {stats.recentLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[#7B8FB5]">No transmissions yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
