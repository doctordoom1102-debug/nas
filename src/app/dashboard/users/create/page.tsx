"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function CreateUserPage() {
    const searchParams = useSearchParams();

    const initialRole = (searchParams.get("role") as "super" | "seller" | "admin") || "super";
    const [createRole, setCreateRole] = useState<"super" | "seller" | "admin">(initialRole);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [newUserData, setNewUserData] = useState({
        username: "",
        displayName: "",
        password: "",
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createdUser, setCreatedUser] = useState<{ username: string; password: string } | null>(null);

    useEffect(() => {
        fetch("/api/auth/me")
            .then(r => r.json())
            .then(data => {
                setUserRole(data.role);
                if (data.role === "super") {
                    setCreateRole("seller");
                }
                setInitialLoading(false);
            })
            .catch(() => setInitialLoading(false));
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (userRole === "super" && createRole === "super") {
            setCreateError("Unauthorized: You cannot create a Super Seller.");
            return;
        }

        if (!newUserData.username || !newUserData.displayName) {
            setCreateError("User Name and Customer Name are required.");
            return;
        }
        setCreating(true);
        setCreateError("");
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newUserData,
                    email: `${newUserData.username}@launcher.local`,
                    role: createRole,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create user");

            setCreatedUser({
                username: data.user?.username || newUserData.username,
                password: data.user?.password || "",
            });
            setNewUserData({ username: "", displayName: "", password: "" });
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const pageTitle = createRole === "admin" ? "Create Admin" : createRole === "super" ? "Create Super Seller" : "Create Seller";

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-blue-500 animate-pulse text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 text-gray-800">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl text-[#212529]">{pageTitle}</h1>
                <div className="text-sm text-[#337ab7]">
                    Home <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-600">{pageTitle}</span>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded shadow-sm">
                {/* Blue Header Bar */}
                <div className="bg-[#4A90D9] text-white px-4 py-2.5 rounded-t">
                    <h2 className="text-[15px] font-medium">{pageTitle}</h2>
                </div>

                <div className="p-6">
                    {/* Error / Success Messages */}
                    {createError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
                            {createError}
                        </div>
                    )}
                    {createdUser && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-300 text-green-800 rounded">
                            <p className="font-semibold text-sm mb-3">User created successfully!</p>
                            <div className="bg-white border border-green-200 rounded p-3 text-sm space-y-2">
                                <div><span className="font-medium text-gray-600">Username:</span> <span className="font-mono font-semibold">{createdUser.username}</span></div>
                                <div><span className="font-medium text-gray-600">Password:</span> <span className="font-mono font-semibold">{createdUser.password}</span></div>
                            </div>
                            <p className="text-xs text-green-600 mt-2">Save these credentials. The password cannot be recovered later.</p>
                            <button
                                type="button"
                                onClick={() => setCreatedUser(null)}
                                className="mt-3 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                                Create another
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleCreateUser}>
                        {/* Row 1: Username + Display Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                            <div>
                                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                                    User Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={newUserData.username}
                                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                                    Customer Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={newUserData.displayName}
                                    placeholder="Enter customer name..."
                                    onChange={(e) => setNewUserData({ ...newUserData, displayName: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Row 2: Password (optional) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                                    Password (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newUserData.password}
                                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                    placeholder="Auto-generated 6 chars if empty"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="border-t border-gray-100 pt-4">
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-5 py-2 bg-[#4A90D9] text-white text-[13px] rounded hover:bg-[#3a7bc8] transition-colors disabled:opacity-60"
                            >
                                {creating ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
