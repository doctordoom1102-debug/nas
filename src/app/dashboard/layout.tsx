"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserSession {
  username: string;
  email: string;
  role: string;
  paymentDue: number;
  isLocked: boolean;
  lockMessage: string;
}

const Icon = ({ d }: { d: string }) => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// Sidebar nav per role — exactly matching the provided snip
function getNavItems(role: string) {
  if (role === "seller") {
    return [
      { href: "/dashboard", label: "Dashboard", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { href: "/dashboard/generate", label: "Create Keys", d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
      { href: "/dashboard/keys", label: "View Keys", d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
      { href: "/dashboard/history/renew", label: "Paid & Renew History", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
      { href: "/dashboard/history/payment", label: "Payment History", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
      { href: "/dashboard/history/paid", label: "Paid Key History", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
      { href: "/dashboard/addip", label: "Add IP", d: "M4 6h16M4 10h16M4 14h16M4 18h16" },
      { href: "/dashboard/profile", label: "Profile", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    ];
  }

  if (role === "super") {
    return [
      { href: "/dashboard", label: "Dashboard", d: "M13 10V3L4 14h7v7l9-11h-7z" },
      { href: "/dashboard/users", label: "View Seller", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
      { href: "/dashboard/users/create?role=seller", label: "Create Seller", d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
      { href: "/dashboard/keys", label: "View Keys", d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
      { href: "/dashboard/history/renew", label: "Paid & Renew History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/history/payment", label: "Payment History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/history/paid", label: "Paid Key History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/profile", label: "Profile", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    ];
  }

  if (role === "admin") {
    return [
      { href: "/dashboard", label: "Dashboard", d: "M13 10V3L4 14h7v7l9-11h-7z" },
      { href: "/dashboard/users", label: "View Seller", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
      { href: "/dashboard/users/create?role=super", label: "Create Super Seller", d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
      { href: "/dashboard/keys", label: "View Keys", d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
      { href: "/dashboard/history/renew", label: "Paid & Renew History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/history/payment", label: "Payment History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/history/paid", label: "Paid Key History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/profile", label: "Profile", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    ];
  }

  if (role === "master_admin") {
    return [
      { href: "/dashboard", label: "Dashboard", d: "M13 10V3L4 14h7v7l9-11h-7z" },
      { href: "/dashboard/users/create?role=admin", label: "Create Mini Admin", d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
      { href: "/dashboard/users", label: "View Seller", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
      { href: "/dashboard/keys", label: "View Keys", d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
      { href: "/dashboard/keys/all", label: "All Keys", d: "M4 6h16M4 10h16M4 14h16M4 18h16" },
      { href: "/dashboard/keys/delete", label: "Manage Key", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
      { href: "/dashboard/history/renew", label: "Paid & Renew History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/history/paid", label: "Paid Key History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/history/payment", label: "Payment History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "/dashboard/bookings", label: "Bookings", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
      { href: "/dashboard/news", label: "News / Announcements", d: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
      { href: "/dashboard/settings", label: "Settings", d: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
      { href: "/dashboard/profile", label: "Profile", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    ];
  }

  // Default / other roles
  return [
    { href: "/dashboard", label: "Dashboard", d: "M13 10V3L4 14h7v7l9-11h-7z" },
    { href: "/dashboard/users", label: "View Seller", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { href: "/dashboard/users/create?role=admin", label: "Create Admin", d: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
    { href: "/dashboard/keys", label: "View Keys", d: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
    { href: "/dashboard/history/renew", label: "Paid & Renew History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { href: "/dashboard/history/payment", label: "Payment History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { href: "/dashboard/history/paid", label: "Paid Key History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { href: "/dashboard/bookings", label: "Today's Booking", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" },
    { href: "/dashboard/profile", label: "Profile", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebarCollapsed", String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) { router.push("/"); }
      else {
        const data = await r.json();
        setUser({
          username: data.username,
          email: data.email,
          role: data.role,
          paymentDue: data.paymentDue || 0,
          isLocked: data.isLocked,
          lockMessage: data.lockMessage,
        });
        setAuthed(true);
      }
    });
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const isMaster = user?.role === "master_admin";

  const getInitials = (name: string) => {
    if (!name?.trim()) return "U";
    const parts = name.trim().split(/[\s_\-\.]+/);
    if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase() || "U";
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#343A40]">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  const navItems = getNavItems(user?.role || "seller");

  return (
    <div className="min-h-screen flex bg-[#ECEFF1]">
      {/* Sidebar — collapsible */}
      <aside
        className={`${sidebarCollapsed ? "w-[60px]" : "w-[230px]"} bg-[#222D32] flex flex-col shrink-0 text-[#C2C7D0] min-h-screen shadow-lg transition-all duration-300 ease-in-out`}
      >
        {/* Brand + Toggle */}
        <div className="h-[50px] bg-[#367FA9] flex items-center px-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded hover:bg-white/20 text-white transition-colors shrink-0"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-[14px] shrink-0">
                A
              </div>
              <span className="text-white font-bold text-[18px] tracking-tight truncate">
                {isMaster ? "AI Interface" : "Launcher"}
              </span>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className={`border-b border-black/20 bg-[#222D32] flex items-center shrink-0 ${sidebarCollapsed ? "px-2 py-3 justify-center" : "px-4 py-4 gap-3"}`}>
          <div className="w-11 h-11 rounded-full bg-gray-600 overflow-hidden ring-2 ring-white/10 shrink-0">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username?.[0] || 'U')}&background=555&color=fff&size=64`}
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col leading-tight overflow-hidden min-w-0">
              <p className="text-[14px] font-semibold text-white truncate">{user?.username}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3C763D] border border-green-400"></div>
                <span className="text-[11px] text-gray-400">Online</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
          {!sidebarCollapsed && (
            <div className="px-4 py-2 text-[12px] font-bold text-[#4B646F] uppercase tracking-wider mb-1">Main Navigation</div>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center border-l-[3px] ${sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3.5 px-4 py-2.5"} text-[14px] transition-all ${isActive
                  ? "bg-[#1E282C] text-white border-l-[#3C8DBC]"
                  : "text-[#B8C7CE] hover:text-white hover:bg-[#1E282C] border-l-transparent"
                  }`}
              >
                <div className={isActive ? "text-[#3C8DBC]" : "text-gray-400"}>
                  <Icon d={item.d} />
                </div>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          <div className="mt-4 pt-4 border-t border-black/10">
            <button
              onClick={logout}
              title={sidebarCollapsed ? "Logout" : undefined}
              className={`w-full flex items-center text-[14px] text-[#B8C7CE] hover:text-white hover:bg-[#1E282C] transition-all border-l-[3px] border-l-transparent ${sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3.5 px-4 py-2.5"}`}
            >
              <div className="text-gray-400">
                <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </div>
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header matching snip */}
        <header className="h-[50px] bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-4 h-full">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {!isMaster && (
              <div className="hidden md:flex items-center text-[13px] gap-2 ml-2">
                <span className="text-[#337ab7]">Dashboard</span>
                <span className="text-gray-400">Control panel</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 h-full">
            <div className="text-[14px] font-bold text-gray-800">
              Payment Due: <span className={isMaster ? "text-gray-700" : "text-[#D9534F]"}>{user?.paymentDue || 0}</span>
            </div>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 border-l pl-4 h-full hover:opacity-80 transition-opacity"
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#337ab7] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(user?.username || "")}
              </div>
              <span className="hidden lg:block text-[14px] font-semibold text-gray-700 truncate max-w-[100px] uppercase">
                {user?.username}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto relative">
          {/* System-wide Lock Overlay */}
          {user?.isLocked && (
            <div className="absolute inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center overflow-auto">
              <div className="bg-[#222D32] border border-red-500/30 rounded-xl shadow-2xl p-8 max-w-md w-full my-auto animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-4h.01M19 19a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Access Locked</h2>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent mb-6"></div>
                <p className="text-[#B8C7CE] text-sm mb-2 leading-relaxed font-semibold">
                  {user.lockMessage || "Your access has been restricted due to outstanding dues."}
                </p>
                <p className="text-[#D9534F] text-[13px] mb-6 leading-relaxed bg-red-500/10 p-3 rounded border border-red-500/20">
                  Aapka Payment Due Hai Jiski Wajeh se Aapka Panel DeActive Kar Diya gaya Hai , Next Day Tak Payment Clear Na Karne Par Aapki Sari ID DeActive Karke Dosre Seller Ka Number Flash Kar Diya Jayega.
                </p>
                <div className="bg-[#1E282C] rounded-lg p-5 mb-6 border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase font-black mb-1.5 tracking-widest text-left">Account Statement</div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 text-xs">Total Due</span>
                    <span className="text-3xl font-mono text-red-500 font-bold">₹{user.paymentDue.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                  </svg>
                  LOGOUT SESSION
                </button>
                <div className="mt-6 flex flex-col items-center gap-1 opacity-50">
                  <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Billing Cycle Reset</span>
                  <span className="text-[11px] text-[#337ab7] font-bold">11:59 PM (System Time)</span>
                </div>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
