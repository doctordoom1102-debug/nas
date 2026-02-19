"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<{ setupLink: string; updaterLink: string }>({ setupLink: "", updaterLink: "" });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setLinks({
          setupLink: data.settings?.download_setup || "",
          updaterLink: data.settings?.download_updater || "",
        });
      })
      .catch(() => { });
  }, []);

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
    <div className="min-h-screen flex items-center justify-center bg-[#222D32] relative overflow-hidden">
      {/* Background decoration arcs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[300px] -right-[200px] w-[700px] h-[700px] rounded-full border border-orange-500/20" />
        <div className="absolute -top-[320px] -right-[220px] w-[750px] h-[750px] rounded-full border border-orange-400/10" />
        <div className="absolute -bottom-[300px] -left-[200px] w-[700px] h-[700px] rounded-full border border-orange-500/15" />
        <div className="absolute -bottom-[320px] -left-[220px] w-[750px] h-[750px] rounded-full border border-orange-400/8" />
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-orange-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-orange-500/3 to-transparent rounded-full blur-3xl" />
      </div>

      {/* SpaceX Login Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-blue-400/30">
          {/* Header */}
          <div className="pt-8 pb-4 text-center">
            <h1 className="text-[36px] font-bold text-[#333] tracking-tight">Nasa Control</h1>
            <p className="text-[#888] text-[14px] mt-1">Sign in to start your session</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 pb-6 space-y-4">
            {/* Username */}
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Username"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            {/* Error Message — SpaceX Red Box */}
            {error && (
              <div className="bg-[#D9534F] text-white p-4 rounded text-[13px] leading-relaxed shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="font-medium">
                  {error.includes("Panel Locked") || error.includes("ACCESS DENIED") ? (
                    <>
                      Aapka Payment Due Hai Jiski Wajeh se Aapka Panel DeActive Kar Diya gaya Hai , Next Day Tak Payment Clear Na Karne Par Aapki Sari ID DeActive Karke Dosre Seller Ka Number Flash Kar Diya Jayega.
                      <br />
                      <span className="font-bold border-t border-white/20 mt-2 block pt-2">
                        Payment Due to activate Panel: {error.split("₹")[1]?.split(".")[0] || error}
                      </span>
                    </>
                  ) : error}
                </p>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold rounded text-[16px] transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {/* Download Links */}
            <div className="pt-1 space-y-1.5">
              {links.setupLink && (
                <a
                  href={links.setupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[#4A90D9] hover:text-[#3A7BC8] text-[14px] font-medium hover:underline transition-colors"
                >
                  Download Setup
                </a>
              )}
              {links.updaterLink && (
                <a
                  href={links.updaterLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[#4A90D9] hover:text-[#3A7BC8] text-[14px] font-medium hover:underline transition-colors"
                >
                  Download Updater
                </a>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
