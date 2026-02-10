"use client";

import { useEffect, useState } from "react";

interface BookingItem {
  _id: string;
  licenseKey: string;
  hwid: string;
  details: string;
  formName: string;
  formTitle: string;
  createdAt: string;
}

interface BookingFull extends BookingItem {
  screenshot: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<BookingFull | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchBookings = async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", "15");
    if (search) params.set("search", search);

    const res = await fetch(`/api/bookings?${params}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setTotal(data.total || 0);
    setPage(data.page || 1);
    setPages(data.pages || 1);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(1);
  };

  const viewScreenshot = async (id: string) => {
    setViewLoading(true);
    setViewing(null);
    const res = await fetch(`/api/bookings/${id}`);
    const data = await res.json();
    if (data.booking) {
      setViewing(data.booking);
    }
    setViewLoading(false);
  };

  const closeViewer = () => {
    setViewing(null);
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Delete this booking record?")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setViewing(null);
    fetchBookings();
  };

  const downloadScreenshot = (booking: BookingFull) => {
    if (!booking.screenshot) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${booking.screenshot}`;
    link.download = `booking_${booking.licenseKey}_${new Date(booking.createdAt).toISOString().slice(0, 10)}.png`;
    link.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Booking Records</h1>
        <span className="text-[#7B8FB5] text-sm">{total} captures</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by key, details, title..."
          className="flex-1 px-4 py-2 rounded-lg text-sm bg-[#111B33] border border-[#1C2B4A] text-white placeholder-[#7B8FB5] focus:outline-none focus:border-[#105BD8]"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#105BD8] text-white rounded-lg text-sm hover:bg-[#2B7AE8] transition"
        >
          Search
        </button>
      </form>

      {/* Bookings Table */}
      <div className="bg-[#111B33] rounded-xl border border-[#1C2B4A] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1C2B4A] text-[#7B8FB5]">
              <th className="text-left p-3">License Key</th>
              <th className="text-left p-3">HWID</th>
              <th className="text-left p-3">Form</th>
              <th className="text-left p-3">Details</th>
              <th className="text-left p-3">Captured</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[#7B8FB5]">
                  Loading...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[#7B8FB5]">
                  No booking records yet.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr
                  key={b._id}
                  className="border-b border-[#1C2B4A]/50 hover:bg-[#1C2B4A]/30"
                >
                  <td className="p-3 font-mono text-xs text-[#2B7AE8] select-all">
                    {b.licenseKey}
                  </td>
                  <td className="p-3 font-mono text-xs text-[#7B8FB5]">
                    {b.hwid ? b.hwid.substring(0, 12) + "..." : "---"}
                  </td>
                  <td className="p-3 text-white">
                    <span className="text-xs">{b.formTitle || b.formName || "---"}</span>
                  </td>
                  <td className="p-3 text-[#7B8FB5] max-w-xs truncate text-xs">
                    {b.details
                      ? b.details.length > 80
                        ? b.details.substring(0, 80) + "..."
                        : b.details
                      : "---"}
                  </td>
                  <td className="p-3 text-[#7B8FB5] text-xs whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => viewScreenshot(b._id)}
                        className="px-2 py-1 bg-[#105BD8]/20 text-[#2B7AE8] rounded text-xs hover:bg-[#105BD8]/30 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteBooking(b._id)}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => fetchBookings(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-[#111B33] border border-[#1C2B4A] text-[#7B8FB5] rounded-lg text-sm disabled:opacity-30 hover:bg-[#1C2B4A] transition"
          >
            Prev
          </button>
          <span className="text-[#7B8FB5] text-sm">
            {page} / {pages}
          </span>
          <button
            onClick={() => fetchBookings(page + 1)}
            disabled={page >= pages}
            className="px-3 py-1.5 bg-[#111B33] border border-[#1C2B4A] text-[#7B8FB5] rounded-lg text-sm disabled:opacity-30 hover:bg-[#1C2B4A] transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Screenshot Viewer Modal */}
      {(viewing || viewLoading) && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={closeViewer}
        >
          <div
            className="bg-[#111B33] border border-[#1C2B4A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {viewLoading ? (
              <div className="p-12 text-center text-[#7B8FB5]">
                Loading screenshot...
              </div>
            ) : viewing ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#1C2B4A]">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Booking Screenshot
                    </h2>
                    <p className="text-xs text-[#7B8FB5] mt-0.5">
                      Key: {viewing.licenseKey} &middot; HWID:{" "}
                      {viewing.hwid || "N/A"} &middot;{" "}
                      {new Date(viewing.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {viewing.screenshot && (
                      <button
                        onClick={() => downloadScreenshot(viewing)}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition"
                      >
                        Download PNG
                      </button>
                    )}
                    <button
                      onClick={closeViewer}
                      className="px-3 py-1.5 bg-[#1C2B4A] text-[#7B8FB5] rounded-lg text-xs hover:bg-[#2D3B5A] transition"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Details */}
                {viewing.details && (
                  <div className="p-4 border-b border-[#1C2B4A]">
                    <p className="text-xs text-[#7B8FB5] mb-1 font-medium">
                      Extracted Details
                    </p>
                    <pre className="text-sm text-white whitespace-pre-wrap font-mono bg-[#0B1026] p-3 rounded-lg">
                      {viewing.details}
                    </pre>
                  </div>
                )}

                {/* Screenshot Image */}
                {viewing.screenshot ? (
                  <div className="p-4">
                    <img
                      src={`data:image/png;base64,${viewing.screenshot}`}
                      alt="Booking screenshot"
                      className="w-full rounded-lg border border-[#1C2B4A]"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#7B8FB5]">
                    No screenshot available — only booking details were captured.
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
