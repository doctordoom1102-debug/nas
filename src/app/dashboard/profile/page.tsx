"use client";

import { useState } from "react";

export default function ProfilePage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to change password");
            setSuccess("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
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
                <h1 className="text-xl font-light text-gray-700">Profile</h1>
                <div className="text-sm text-[#337ab7]">
                    Home <span className="text-gray-400 mx-1">/</span> Profile
                </div>
            </div>

            <div className="p-5 flex-1">
                <div className="bg-white rounded shadow-sm">
                    {/* Blue header */}
                    <div className="bg-[#4A90D9] text-white px-4 py-2.5 rounded-t text-[14px] font-medium">
                        Change Password
                    </div>

                    <div className="p-6">
                        {/* Error / Success messages */}
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-2.5 rounded text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 bg-green-50 border border-green-300 text-green-700 px-4 py-2.5 rounded text-sm">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
                            {/* Current Password */}
                            <div>
                                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:border-[#4A90D9]"
                                />
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:border-[#4A90D9]"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:border-[#4A90D9]"
                                />
                            </div>

                            {/* Submit */}
                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 bg-[#4A90D9] text-white text-[13px] rounded hover:bg-[#3a7bc8] transition-colors disabled:opacity-60"
                                >
                                    {loading ? "Changing..." : "Change Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="px-5 py-3 flex justify-between items-center text-[12px] text-gray-500 border-t border-gray-200 bg-white">
                <div>
                    Copyright © 2026{" "}
                    <span className="text-[#337ab7] font-medium">AI Interface portal.</span>{" "}
                    All rights reserved.
                </div>
                <div>Version 1.1</div>
            </footer>
        </div>
    );
}
