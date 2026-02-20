"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [setupLink, setSetupLink] = useState("");
    const [updaterLink, setUpdaterLink] = useState("");
    const [whatsappLink, setWhatsappLink] = useState("");
    const [telegramLink, setTelegramLink] = useState("");
    const [appVersion, setAppVersion] = useState("303.0");
    const [appZipUrl, setAppZipUrl] = useState("");
    const [appKill, setAppKill] = useState(false);
    const [generatePageEnabled, setGeneratePageEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((data) => {
                setSetupLink(data.settings?.download_setup || "");
                setUpdaterLink(data.settings?.download_updater || "");
                setWhatsappLink(data.settings?.whatsapp_link || "");
                setTelegramLink(data.settings?.telegram_link || "");
                setAppVersion(data.settings?.app_version || "303.0");
                setAppZipUrl(data.settings?.app_zip_url || "");
                setAppKill(data.settings?.app_kill === "true");
                setGeneratePageEnabled(data.settings?.generate_page_enabled !== "false");
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const saveSettings = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    settings: {
                        download_setup: setupLink,
                        download_updater: updaterLink,
                        whatsapp_link: whatsappLink,
                        telegram_link: telegramLink,
                        app_version: appVersion,
                        app_zip_url: appZipUrl,
                        app_kill: appKill ? "true" : "false",
                        generate_page_enabled: generatePageEnabled ? "true" : "false",
                    },
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ text: "Settings saved successfully!", type: "success" });
            } else {
                setMessage({ text: data.error || "Failed to save settings.", type: "error" });
            }
        } catch {
            setMessage({ text: "Failed to save settings.", type: "error" });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-[#3C8DBC] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-[#222D32] rounded-t-lg border-b border-[#367FA9]">
                <div className="px-5 py-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#3C8DBC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-white font-bold text-[16px]">Platform Settings</h2>
                </div>
            </div>

            <div className="bg-white rounded-b-lg shadow-sm p-6">
                {/* Messages */}
                {message && (
                    <div className={`mb-5 p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {message.text}
                    </div>
                )}

                {/* Generate Page Access */}
                <div className="mb-8">
                    <h3 className="text-[14px] font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        /generate Page Access
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Enable or disable public access to the key generation page at /generate.</p>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={generatePageEnabled}
                            onClick={() => setGeneratePageEnabled(!generatePageEnabled)}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:ring-offset-2 ${generatePageEnabled ? "bg-[#3C8DBC]" : "bg-gray-300"}`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${generatePageEnabled ? "translate-x-5" : "translate-x-1"}`}
                            />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                            {generatePageEnabled ? "Enabled" : "Disabled"}
                        </span>
                    </div>
                </div>

                {/* Download Links Section */}
                <div className="mb-8">
                    <h3 className="text-[14px] font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Login Page Download Links
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">These links appear on the login page below the Sign In button.</p>

                    <div className="space-y-4">
                        {/* Download Setup Link */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                Download Setup Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={setupLink}
                                    onChange={(e) => setSetupLink(e.target.value)}
                                    placeholder="https://example.com/setup.exe"
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent"
                                />
                                {setupLink && (
                                    <a
                                        href={setupLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                                        title="Test Link"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Download Updater Link */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                Download Updater Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={updaterLink}
                                    onChange={(e) => setUpdaterLink(e.target.value)}
                                    placeholder="https://example.com/updater.exe"
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent"
                                />
                                {updaterLink && (
                                    <a
                                        href={updaterLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                                        title="Test Link"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Channel Links Section */}
                <div className="mb-8">
                    <h3 className="text-[14px] font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Channel Links (shown in desktop app)
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">These links are shown in the news popup of the desktop application. Users can click to join your channels.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                WhatsApp Channel Link
                            </label>
                            <input
                                type="url"
                                value={whatsappLink}
                                onChange={(e) => setWhatsappLink(e.target.value)}
                                placeholder="https://whatsapp.com/channel/..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                Telegram Channel Link
                            </label>
                            <input
                                type="url"
                                value={telegramLink}
                                onChange={(e) => setTelegramLink(e.target.value)}
                                placeholder="https://telegram.me/..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* App Update Control */}
                <div className="mb-8">
                    <h3 className="text-[14px] font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Desktop App Update Control
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Control auto-updates for all running desktop applications. When you upload a new version, all EXEs will auto-update on next launch.</p>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                    Current App Version
                                </label>
                                <input
                                    type="text"
                                    value={appVersion}
                                    onChange={(e) => setAppVersion(e.target.value)}
                                    placeholder="303.0"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent"
                                />
                                <p className="text-xs text-gray-400 mt-1">Increase this to trigger auto-update on all clients</p>
                            </div>
                            <div className="flex items-center gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setAppKill(!appKill)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${appKill ? "bg-red-500" : "bg-gray-300"}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${appKill ? "translate-x-5" : "translate-x-1"}`} />
                                </button>
                                <div>
                                    <span className={`text-sm font-medium ${appKill ? "text-red-600" : "text-gray-700"}`}>
                                        Kill Switch {appKill ? "ON" : "OFF"}
                                    </span>
                                    <p className="text-xs text-gray-400">Force-close all running EXEs on next check</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                Update ZIP URL
                            </label>
                            <input
                                type="url"
                                value={appZipUrl}
                                onChange={(e) => setAppZipUrl(e.target.value)}
                                placeholder="https://example.com/NASAControl_v304.zip"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">Direct link to the update ZIP. Leave empty to disable auto-updates.</p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="border-t pt-5 flex justify-end">
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="px-8 py-2.5 bg-[#3C8DBC] text-white rounded-lg font-semibold text-sm hover:bg-[#367FA9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
