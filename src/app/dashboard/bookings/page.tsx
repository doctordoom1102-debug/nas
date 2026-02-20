"use client";

import { useEffect, useState, useCallback } from "react";

interface BookingItem {
  _id: string;
  licenseKey: string;
  hwid: string;
  details: string;
  formName: string;
  formTitle: string;
  createdAt: string;
}

interface BookingDetail extends BookingItem {
  screenshot?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookingDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const LIMIT = 20;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const viewDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelected(data.booking);
      }
    } catch {}
    setLoadingDetail(false);
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Delete this booking record?")) return;
    try {
      await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      fetchBookings();
      if (selected?._id === id) setSelected(null);
    } catch {}
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const isSuccess = (title: string) => title?.toLowerCase().includes("success");

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Booking Records</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total bookings received from desktop clients</p>
        </div>
        <button
          onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
          className="text-xs text-blue-600 hover:underline"
        >
          Reset filters
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by license key, details, or status..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button type="submit" className="bg-[#337ab7] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#286090] transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">License Key</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Details</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No bookings found</td></tr>
              ) : bookings.map((b) => (
                <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isSuccess(b.formTitle)
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isSuccess(b.formTitle) ? "bg-green-500" : "bg-red-500"}`}></span>
                      {b.formTitle || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.licenseKey}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[350px] truncate" title={b.details}>{b.details}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => viewDetail(b._id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteBooking(b._id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">
              Page {page} of {pages} ({total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page >= pages}
                className="px-3 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(selected || loadingDetail) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !loadingDetail && setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {loadingDetail ? (
              <div className="p-12 text-center text-gray-400">Loading booking details...</div>
            ) : selected && (
              <>
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Booking Detail</h2>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                      isSuccess(selected.formTitle) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {selected.formTitle}
                    </span>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">License Key</label>
                      <p className="font-mono text-sm text-gray-800 mt-0.5">{selected.licenseKey}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">HWID</label>
                      <p className="font-mono text-sm text-gray-800 mt-0.5 break-all">{selected.hwid}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Form</label>
                      <p className="text-sm text-gray-800 mt-0.5">{selected.formName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Received At</label>
                      <p className="text-sm text-gray-800 mt-0.5">{new Date(selected.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Details</label>
                    <p className="text-sm text-gray-800 mt-0.5 bg-gray-50 rounded-lg p-3 border">{selected.details}</p>
                  </div>
                  {selected.screenshot && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Screenshot</label>
                      <div className="mt-2 border rounded-lg overflow-hidden bg-gray-900">
                        <img
                          src={selected.screenshot.startsWith("data:") ? selected.screenshot : `data:image/png;base64,${selected.screenshot}`}
                          alt="Booking screenshot"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
                  <button
                    onClick={() => deleteBooking(selected._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
