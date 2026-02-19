"use client";
import { useState, useEffect } from "react";

interface NewsItem {
    _id: string;
    title: string;
    content: string;
    isActive: boolean;
    priority: number;
    createdAt: string;
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const [form, setForm] = useState({ title: "", content: "", isActive: true, priority: 0 });

    const fetchNews = async () => {
        try {
            const res = await fetch("/api/admin/news");
            const data = await res.json();
            setNews(data.news || []);
        } catch {
            setMessage({ text: "Failed to load news", type: "error" });
        }
        setLoading(false);
    };

    useEffect(() => { fetchNews(); }, []);

    const resetForm = () => {
        setForm({ title: "", content: "", isActive: true, priority: 0 });
        setEditing(null);
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            setMessage({ text: "Title and content are required", type: "error" });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const url = editing ? `/api/admin/news/${editing}` : "/api/admin/news";
            const method = editing ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ text: editing ? "News updated!" : "News created!", type: "success" });
                resetForm();
                fetchNews();
            } else {
                setMessage({ text: data.error || "Failed to save", type: "error" });
            }
        } catch {
            setMessage({ text: "Failed to save news", type: "error" });
        }
        setSaving(false);
    };

    const handleEdit = (item: NewsItem) => {
        setForm({ title: item.title, content: item.content, isActive: item.isActive, priority: item.priority });
        setEditing(item._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this news item?")) return;
        try {
            const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setMessage({ text: "News deleted", type: "success" });
                fetchNews();
            } else {
                setMessage({ text: data.error || "Failed to delete", type: "error" });
            }
        } catch {
            setMessage({ text: "Failed to delete", type: "error" });
        }
    };

    const toggleActive = async (item: NewsItem) => {
        try {
            await fetch(`/api/admin/news/${item._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !item.isActive }),
            });
            fetchNews();
        } catch {}
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
                <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#3C8DBC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <h2 className="text-white font-bold text-[16px]">News Management</h2>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowForm(!showForm); }}
                        className="px-4 py-1.5 bg-[#3C8DBC] text-white rounded text-sm font-semibold hover:bg-[#367FA9] transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {showForm ? "Cancel" : "Add News"}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-b-lg shadow-sm p-6">
                {message && (
                    <div className={`mb-5 p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {message.text}
                    </div>
                )}

                {/* Create / Edit Form */}
                {showForm && (
                    <div className="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                            {editing ? "Edit News" : "Create News"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Server Maintenance Notice"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Content</label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    placeholder="Write news content here... This will be shown in the desktop application."
                                    rows={5}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC] focus:border-transparent resize-y"
                                />
                            </div>
                            <div className="flex gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Priority</label>
                                    <input
                                        type="number"
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C8DBC]"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Higher = shown first</p>
                                </div>
                                <div className="flex items-center gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.isActive ? "bg-[#3C8DBC]" : "bg-gray-300"}`}
                                    >
                                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${form.isActive ? "translate-x-5" : "translate-x-1"}`} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700">{form.isActive ? "Active" : "Inactive"}</span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={resetForm} className="px-5 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-[#3C8DBC] text-white rounded-lg font-semibold text-sm hover:bg-[#367FA9] disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {editing ? "Update" : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* News List */}
                {news.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <p className="text-sm">No news items yet. Click "Add News" to create one.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {news.map((item) => (
                            <div key={item._id} className={`p-4 rounded-lg border ${item.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                                            {item.isActive ? (
                                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-green-100 text-green-700 rounded-full">Active</span>
                                            ) : (
                                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-gray-200 text-gray-500 rounded-full">Inactive</span>
                                            )}
                                            {item.priority > 0 && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-600 rounded-full">P{item.priority}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.content}</p>
                                        <p className="text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => toggleActive(item)}
                                            title={item.isActive ? "Deactivate" : "Activate"}
                                            className={`p-1.5 rounded transition-colors ${item.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                {item.isActive
                                                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    : <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                }
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
