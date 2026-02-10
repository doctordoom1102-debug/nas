"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push("/dashboard");
    } else {
      setError(data.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1026] relative overflow-hidden">
      {/* Stars background effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-[10%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" />
        <div className="absolute top-[30%] left-[70%] w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-[60%] left-[25%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[80%] left-[80%] w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[20%] left-[50%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
        <div className="absolute top-[50%] left-[40%] w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: "0.8s" }} />
        <div className="absolute top-[75%] left-[60%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "1.2s" }} />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#105BD8]/20 border-2 border-[#105BD8]/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#105BD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wider">NASA</h1>
          <p className="text-[#7B8FB5] mt-1 text-sm tracking-wide">MISSION CONTROL PANEL</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-[#111B33]/80 backdrop-blur-sm rounded-xl border border-[#1C2B4A] p-6">
          <div>
            <label className="block text-sm text-[#7B8FB5] mb-1">Username or Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm"
              placeholder="commander@nasa.space"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#7B8FB5] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-[#FC3D21] text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#105BD8] hover:bg-[#2B7AE8] text-white font-bold rounded-lg transition disabled:opacity-50 tracking-wide"
          >
            {loading ? "LAUNCHING..." : "LAUNCH SESSION"}
          </button>
        </form>

        <p className="text-center text-[#7B8FB5]/50 text-xs mt-6">NASA Control System v1.0</p>
      </div>
    </div>
  );
}
