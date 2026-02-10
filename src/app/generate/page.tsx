"use client";

import { useState } from "react";
import Link from "next/link";

export default function GeneratePublicPage() {
  const [key, setKey] = useState("");
  const [expiresIn, setExpiresIn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generateKey = async () => {
    setLoading(true);
    setError("");
    setKey("");
    setCopied(false);

    try {
      const res = await fetch("/api/keys/generate", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate key");
      } else {
        setKey(data.key);
        setExpiresIn(data.expiresIn || "7 days");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const copyKey = () => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1026] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-[8%] left-[12%] w-1 h-1 bg-white rounded-full animate-pulse" />
        <div className="absolute top-[25%] left-[75%] w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-[55%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[85%] left-[85%] w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[15%] left-[55%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
        <div className="absolute top-[45%] left-[38%] w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: "0.8s" }} />
        <div className="absolute top-[70%] left-[65%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "1.2s" }} />
        <div className="absolute top-[35%] left-[90%] w-1 h-1 bg-cyan-200 rounded-full animate-pulse" style={{ animationDelay: "0.6s" }} />
        <div className="absolute top-[90%] left-[10%] w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: "1.8s" }} />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#105BD8]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg p-8 relative z-10">
        {/* Logo & branding */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-[#105BD8]/10 border-2 border-[#105BD8]/40 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-12 h-12 text-[#105BD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-wider">NASA</h1>
          <p className="text-[#7B8FB5] mt-2 text-sm tracking-widest uppercase">Free Access Key</p>
        </div>

        {/* Main card */}
        <div className="bg-[#111B33]/80 backdrop-blur-sm rounded-2xl border border-[#1C2B4A] p-8">
          {!key ? (
            <>
              <p className="text-center text-[#7B8FB5] text-sm mb-6 leading-relaxed">
                Generate a free demo access key to try NASA Control. 
                Keys are valid for <span className="text-[#2B7AE8] font-medium">7 days</span> and 
                limited to <span className="text-[#2B7AE8] font-medium">3 per hour</span>.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-[#FC3D21]/10 border border-[#FC3D21]/30 text-[#FC3D21] text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={generateKey}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#105BD8] to-[#2B7AE8] hover:from-[#2B7AE8] hover:to-[#105BD8] text-white font-bold text-lg rounded-xl transition-all duration-300 disabled:opacity-50 tracking-wide shadow-lg shadow-[#105BD8]/25 hover:shadow-[#105BD8]/40 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    GENERATING...
                  </span>
                ) : (
                  "GENERATE ACCESS KEY"
                )}
              </button>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white">Key Generated!</h2>
                <p className="text-[#7B8FB5] text-xs mt-1">Expires in {expiresIn}</p>
              </div>

              {/* Key display */}
              <div
                onClick={copyKey}
                className="relative group cursor-pointer bg-[#0B1026] border border-[#1C2B4A] rounded-xl p-5 mb-5 hover:border-[#105BD8]/50 transition"
              >
                <p className="text-center font-mono text-xl text-[#2B7AE8] font-bold tracking-widest select-all break-all">
                  {key}
                </p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <span className="text-xs text-[#7B8FB5] bg-[#1C2B4A] px-2 py-1 rounded">
                    {copied ? "Copied!" : "Click to copy"}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[#0B1026]/50 rounded-lg p-4 mb-5 border border-[#1C2B4A]/50">
                <p className="text-xs text-[#7B8FB5] leading-relaxed">
                  <span className="text-white font-medium">How to use:</span> Open the NASA desktop app, 
                  paste this key in the license field, and press Enter. The key binds to your 
                  device on first use.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={copyKey}
                  className="flex-1 py-3 bg-[#105BD8] hover:bg-[#2B7AE8] text-white font-bold rounded-xl transition tracking-wide text-sm"
                >
                  {copied ? "COPIED!" : "COPY KEY"}
                </button>
                <button
                  onClick={() => { setKey(""); setError(""); setCopied(false); }}
                  className="px-5 py-3 bg-[#1C2B4A] hover:bg-[#2D3B5A] text-[#7B8FB5] hover:text-white rounded-xl transition text-sm"
                >
                  New Key
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <Link
            href="/"
            className="text-[#7B8FB5]/60 hover:text-[#7B8FB5] text-xs transition"
          >
            Admin Login
          </Link>
          <p className="text-[#7B8FB5]/30 text-xs">NASA Control System v1.0</p>
        </div>
      </div>
    </div>
  );
}
