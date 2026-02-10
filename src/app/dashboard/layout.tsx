"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserSession {
  username: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) {
        router.push("/");
      } else {
        const data = await r.json();
        setUser({ username: data.username, email: data.email, role: data.role });
        setAuthed(true);
      }
    });
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1026]">
        <div className="text-[#7B8FB5] flex items-center gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Initializing...
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Mission Control", icon: "M3.75 3A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75z", roles: ["master_admin", "admin", "super", "seller"] },
    { href: "/dashboard/keys", label: "Access Keys", icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z", roles: ["master_admin", "admin", "super", "seller"] },
    { href: "/dashboard/generate", label: "Generate", icon: "M12 4.5v15m7.5-7.5h-15", roles: ["master_admin", "admin", "super", "seller"] },
    { href: "/dashboard/users", label: "Crew", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z", roles: ["master_admin", "admin", "super"] },
    { href: "/dashboard/bookings", label: "Bookings", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z", roles: ["master_admin", "admin", "super"] },
    { href: "/dashboard/logs", label: "Flight Log", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z", roles: ["master_admin", "admin", "super", "seller"] },
  ];

  const roleLabel: Record<string, string> = {
    master_admin: "Commander",
    admin: "Captain",
    super: "Lieutenant",
    seller: "Pilot",
  };

  const roleColor: Record<string, string> = {
    master_admin: "text-[#FC3D21]",
    admin: "text-[#F0C030]",
    super: "text-[#00B4D8]",
    seller: "text-[#105BD8]",
  };

  return (
    <div className="min-h-screen flex bg-[#0B1026]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#111B33] border-r border-[#1C2B4A] flex flex-col">
        <div className="p-4 border-b border-[#1C2B4A]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#105BD8]/20 border border-[#105BD8]/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#105BD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-widest">NASA</span>
          </Link>
          <p className="text-[10px] text-[#7B8FB5] mt-0.5 ml-10 tracking-wider">CONTROL v1.0</p>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b border-[#1C2B4A]">
            <p className="text-sm text-white font-medium truncate">{user.username}</p>
            <p className={`text-xs ${roleColor[user.role] || "text-[#7B8FB5]"} tracking-wide`}>
              {roleLabel[user.role] || user.role}
            </p>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter((item) => !user || item.roles.includes(user.role))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  pathname === item.href
                    ? "bg-[#105BD8]/15 text-[#2B7AE8]"
                    : "text-[#7B8FB5] hover:bg-[#1C2B4A] hover:text-white"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            ))}
        </nav>

        <div className="p-3 border-t border-[#1C2B4A]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#7B8FB5] hover:bg-[#1C2B4A] hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Abort Mission
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
