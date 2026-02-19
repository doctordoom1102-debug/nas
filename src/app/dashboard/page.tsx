"use client";

import { useEffect, useState } from "react";

interface Stats {
  total: number;
  active: number;
  expired: number;
  banned: number;
  inactive: number;
  pending: number;
  superSellers: number;
  sellers: number;
  miniAdmins?: number; // Added for master admin
  todayPaidKeys: number;
  todaySoldKeys: number;
}

// SVG icons matching the screenshot exactly
const IconPerson = () => (
  <svg viewBox="0 0 80 80" fill="currentColor" className="w-16 h-16 opacity-25">
    <circle cx="40" cy="22" r="16" />
    <path d="M10 70c0-16.6 13.4-30 30-30s30 13.4 30 30H10z" />
    <circle cx="62" cy="18" r="8" fill="currentColor" opacity="0.7" />
    <path d="M54 34c4-2 8-2 12 0" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.7" />
    <line x1="68" y1="14" x2="68" y2="22" stroke="currentColor" strokeWidth="3" />
    <line x1="64" y1="18" x2="72" y2="18" stroke="currentColor" strokeWidth="3" />
  </svg>
);

const IconCart = () => (
  <svg viewBox="0 0 80 80" fill="currentColor" className="w-16 h-16 opacity-25">
    <path d="M15 15h10l5 35h35l5-25H30" fill="none" stroke="currentColor" strokeWidth="5" />
    <circle cx="35" cy="65" r="5" />
    <circle cx="65" cy="65" r="5" />
  </svg>
);

const IconList = () => (
  <svg viewBox="0 0 80 80" fill="currentColor" className="w-16 h-16 opacity-25">
    <rect x="10" y="15" width="60" height="8" rx="2" />
    <rect x="10" y="32" width="60" height="8" rx="2" />
    <rect x="10" y="49" width="60" height="8" rx="2" />
    <rect x="10" y="66" width="40" height="8" rx="2" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 80 80" fill="currentColor" className="w-16 h-16 opacity-25">
    <rect x="10" y="15" width="60" height="8" rx="2" />
    <rect x="10" y="32" width="60" height="8" rx="2" />
    <rect x="10" y="49" width="60" height="8" rx="2" />
    <rect x="10" y="66" width="40" height="8" rx="2" />
  </svg>
);

const IconChart = () => (
  <svg viewBox="0 0 80 80" fill="currentColor" className="w-16 h-16 opacity-25">
    <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="100 101" strokeDashoffset="0" />
    <path d="M40 40 L40 8 A32 32 0 0 1 72 40 Z" />
    <path d="M40 40 L72 40 A32 32 0 0 1 40 72 Z" opacity="0.5" />
  </svg>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    Promise.all([fetch("/api/admin/stats"), fetch("/api/auth/me")])
      .then(async ([sRes, uRes]) => {
        const s = await sRes.json();
        const u = await uRes.json();
        setStats(s);
        setCurrentUser(u);
      })
      .catch(console.error);
    const t = setInterval(() => {
      fetch("/api/admin/stats").then(r => r.json()).then(setStats);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const role = currentUser?.role;
  const isMaster = role === "master_admin";
  const isSuper = role === "super";
  const isAdmin = role === "admin"; // Strictly standard admin

  // Master Admin Cards — Exactly matching Snip 892
  const masterCards = stats ? [
    { label: "Mini Admin", value: stats.miniAdmins || 0, bg: "bg-[#337ab7]", darker: "bg-[#286090]", Icon: IconPerson },
    { label: "Super Seller", value: stats.superSellers, bg: "bg-[#5bc0de]", darker: "bg-[#31b0d5]", Icon: IconPerson },
    { label: "Seller", value: stats.sellers, bg: "bg-[#5cb85c]", darker: "bg-[#449d44]", Icon: IconPerson },
    { label: "Total Key", value: stats.total, bg: "bg-[#d9534f]", darker: "bg-[#c9302c]", Icon: IconChart },
    { label: "Total Active Key", value: stats.active, bg: "bg-[#5cb85c]", darker: "bg-[#449d44]", Icon: IconChart },
    { label: "Total Paid Keys", value: stats.total - stats.pending, bg: "bg-[#f0ad4e]", darker: "bg-[#ec971f]", Icon: IconCart },
    { label: "Total Unpaid Keys", value: stats.pending, bg: "bg-[#d9534f]", darker: "bg-[#c9302c]", Icon: IconChart },
    { label: "Today Paid Keys", value: stats.todayPaidKeys, bg: "bg-[#337ab7]", darker: "bg-[#286090]", Icon: IconCart },
    { label: "Today Sold Keys", value: stats.todaySoldKeys, bg: "bg-[#5bc0de]", darker: "bg-[#31b0d5]", Icon: IconCart },
  ] : [];

  // Super Seller stat cards — Matching snip exactly
  const superCards = stats ? [
    { label: "Seller", value: stats.sellers, bg: "bg-[#4183D7]", darker: "bg-[#337AB7]", Icon: IconPerson },
    { label: "Total ID", value: stats.total, bg: "bg-[#5CB85C]", darker: "bg-[#4E9D4E]", Icon: IconList },
    { label: "Active ID", value: stats.active, bg: "bg-[#F0AD4E]", darker: "bg-[#EC971F]", Icon: IconList },
    { label: "Today Sold Id", value: stats.todaySoldKeys, bg: "bg-[#D9534F]", darker: "bg-[#C9302C]", Icon: IconChart },
  ] : [];

  // Admin stat cards — matching the provided snip perfectly
  const adminCards = stats ? [
    { label: "Super Seller", value: stats.superSellers, bg: "bg-[#00C0EF]", darker: "bg-[#00A7D0]", Icon: IconPerson },
    { label: "Seller", value: stats.sellers, bg: "bg-[#00A65A]", darker: "bg-[#008D4C]", Icon: IconPerson },
    { label: "Total Key", value: stats.total, bg: "bg-[#DD4B39]", darker: "bg-[#D73925]", Icon: IconList },
    { label: "Total Active Key", value: stats.active, bg: "bg-[#00A65A]", darker: "bg-[#008D4C]", Icon: IconCheck },
    { label: "Total Paid Keys", value: stats.total - stats.pending, bg: "bg-[#F39C12]", darker: "bg-[#DB8B0B]", Icon: IconList },
    { label: "Total Unpaid Keys", value: stats.pending, bg: "bg-[#DD4B39]", darker: "bg-[#D73925]", Icon: IconChart },
    { label: "Today Paid Keys", value: stats.todayPaidKeys, bg: "bg-[#F39C12]", darker: "bg-[#DB8B0B]", Icon: IconChart },
    { label: "Today Sold Keys", value: stats.todaySoldKeys, bg: "bg-[#00C0EF]", darker: "bg-[#00A7D0]", Icon: IconChart },
  ] : [];

  const cards = isMaster ? masterCards : isSuper ? superCards : (isAdmin || role === "admin" || role === "master_admin") ? adminCards : [];

  // Re-adjust cards for Master specifically
  const finalCards = isMaster ? masterCards : cards;

  return (
    <div className="flex flex-col min-h-screen bg-[#ECEFF1] text-gray-800">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm min-h-[50px]">
        <h1 className="text-2xl font-light text-gray-700">Dashboard</h1>
        {isMaster ? (
          <div className="text-[18px] font-bold text-gray-800">
            Payment Due: {currentUser?.paymentDue || 0}
          </div>
        ) : (
          <div className="text-sm">
            <span className="text-[#337ab7]">Home</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-500">Dashboard</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-3 flex-1 overflow-auto custom-scrollbar">
        {isAdmin && (
          <>
            {/* Admin Banners */}
            <div className="bg-[#5CB85C] text-white px-4 py-4 rounded shadow-sm relative overflow-hidden group">
              <div className="flex flex-col gap-1 relative z-10">
                <h2 className="text-xl font-medium tracking-tight">Congratulations, aaj ke din aap ka price 2000Rs per ID ho gaya hai!!!</h2>
                <div className="flex items-center gap-2 text-[14px] opacity-95">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Total active id 200+
                </div>
                <div className="flex items-center gap-2 text-[14px] opacity-95">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Current Payment due is less than 50,000Rs.
                </div>
              </div>
            </div>
            <div className="bg-[#D9534F] text-white px-4 py-2.5 rounded shadow-sm text-[14px]">
              <span className="font-bold">Important Message :-</span> 15 NOV tak Agar Aapke Mini Per 200+ Active Paid ID se Kam Rahega to Aapka Mini Super me Convert Kar Diya Jayega aur Aapko Super ke Rate se hi Payment Karna hoga
            </div>
            <div className="bg-[#D9534F] text-white px-4 py-2.5 rounded shadow-sm text-[14px]">
              <span className="font-bold">Important Message :-</span> Super ko Super ke hi Rate se Sell Karen, jo koi bhi Super ko Kam Rate me Dene ka pakka Proof Dega usko 3 ID Free milegi jiska Due Aapke MINI pe Add kar diya jayega
            </div>
          </>
        )}

        {isSuper && (
          <div className="space-y-4 mb-4">
            {/* News Box */}
            <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-[#4183D7] text-white px-4 py-2 text-[14px] font-semibold">News</div>
              <div className="p-4">
                <div className="bg-[#5CB85C] text-white px-4 py-6 rounded text-[16px] font-medium">
                  Congratulations, aaj ke din aap ka price 2200Rs per ID ho gaya hai!!!
                </div>
              </div>
            </div>
            {/* Message Box */}
            <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-[#5BC0DE] text-white px-4 py-2 text-[14px] font-semibold">Message</div>
              <div className="p-4">
                <div className="bg-[#D9534F] text-white px-4 py-4 rounded text-[14px]">
                  Payment Pending: {currentUser?.paymentDue || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-[#5CB85C] text-white px-4 py-4 rounded shadow-sm bg-opacity-90">
            <div className="flex flex-col gap-1 text-[13px]">
              <p>Dear MiniAdmin Daily Reward System Activate Kar Diya Gaya hai</p>
              <p>21 Key Paid Karne Per Rs:- 0 (21 To 30 Key Paid hone pe Rs-0 Per Key)</p>
              <p>31 Key Paid Karne Per Rs:- 0 (31 To 40 Key Paid hone pe Rs-0 Per Key)</p>
              <p>41 Key Paid Karne Per Rs:- 0 (41 Key paid hone pe Rs-0 Per Key)</p>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        {finalCards.length > 0 && (
          <div className={`grid gap-4 ${isMaster ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-4"}`}>
            {finalCards.map((c, i) => (
              <div key={i} className={`${c.bg} text-white rounded shadow-sm overflow-hidden flex flex-col`}>
                {/* Card body */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 min-h-[90px]">
                  <div>
                    <div className={isMaster ? "text-[32px] font-bold leading-tight" : "text-3xl font-bold leading-none"}>{c.value}</div>
                    <div className={isMaster ? "text-[14px] mt-0.5 opacity-90 font-medium" : "text-[13px] mt-1 opacity-90"}>{c.label}</div>
                  </div>
                  <div className={isMaster ? "opacity-30" : "flex items-end justify-end"}>
                    <c.Icon />
                  </div>
                </div>
                {/* More info footer */}
                <div className={`${c.darker} px-4 py-1.5 flex items-center ${isMaster ? "justify-center gap-1.5" : "justify-between"} text-[12px] font-medium cursor-pointer hover:bg-black/10 transition-all mt-auto`}>
                  <span>More info</span>
                  {isMaster ? (
                    <div className="w-3.5 h-3.5 rounded-full border border-white/40 flex items-center justify-center">
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                      </svg>
                    </div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seller role: specifically matching the provided snip */}
        {role === "seller" && (
          <div className="space-y-4">
            {/* News Section */}
            <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-[#4183D7] text-white px-4 py-2 text-[14px] font-semibold">
                News
              </div>
              <div className="p-4">
                <div className="bg-[#5CB85C] text-white px-5 py-6 rounded text-[16px] font-medium shadow-sm">
                  Congratulations, aaj ke din aap ka price 2400Rs per ID ho gaya hai!!!
                </div>
              </div>
            </div>

            {/* Message Section */}
            <div className="space-y-2">
              <div className="text-[13px] text-gray-500 font-medium px-1">Message</div>
              <div className="bg-white rounded shadow-sm p-4 border border-gray-200">
                <div className="bg-[#D9534F] text-white px-4 py-4 rounded text-[14px] font-medium shadow-sm">
                  Payment Pending: {currentUser?.paymentDue || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-5 py-3 flex justify-between items-center text-[12px] text-gray-500 border-t border-gray-200 bg-white">
        <div>Copyright © 2026 <span className="text-[#337ab7] font-medium">{isMaster ? "AI Interface" : "Launcher"} portal.</span> All rights reserved.</div>
        <div>Version 1.1</div>
      </footer>
    </div>
  );
}


