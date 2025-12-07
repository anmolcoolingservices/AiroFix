// app/edit-booking/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Booking = {
  id: string;
  customerName?: string;
  serviceType?: string;
  categoryName?: string;
  itemName?: string;
  date?: string;
  slot?: string;
  approxPrice?: string;
  status?: string;
  note?: string;
  startTs?: number;
  slotTs?: number;
};

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export default function EditBookingPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setLoadError("Invalid edit link – booking ID missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBooking() {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch(`/api/bookings/${bookingId}`);
        const data = await res.json();

        if (!res.ok || !data.success || !data.booking) {
          throw new Error(data.error || "Booking details nahi mil paaye.");
        }

        if (cancelled) return;

        const b = data.booking;
        setBooking(b);
        setDate(b.date || "");
        setSlot(b.slot || "");
        setNote(b.note || "");
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || "Error loading booking.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBooking();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const { canEdit, cannotReason } = useMemo(() => {
    if (!booking) return { canEdit: false, cannotReason: "" };

    if (booking.status !== "pending") {
      return {
        canEdit: false,
        cannotReason:
          "Sirf pending bookings edit ho sakti hain. Ye booking ab pending state me nahi hai.",
      };
    }

    const now = Date.now();
    const startTs = booking.startTs || booking.slotTs;
    if (startTs && startTs - now < TWELVE_HOURS_MS) {
      return {
        canEdit: false,
        cannotReason:
          "Visit ke 12 ghante se kam time bacha hai, isliye booking edit nahi ho sakti. Support se contact karein.",
      };
    }

    return { canEdit: true, cannotReason: "" };
  }, [booking]);

  async function handleSave() {
    if (!bookingId || !booking) return;
    setSaveError("");
    setSaveSuccess("");

    if (!canEdit) {
      setSaveError(
        cannotReason ||
          "Is booking ko rules ke hisaab se edit nahi kiya ja sakta."
      );
      return;
    }

    if (!date || !slot) {
      setSaveError("Date aur slot required hain.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          slot,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "Booking update karte waqt error aaya. Thodi der baad try karein."
        );
      }

      setSaveSuccess("Booking details update ho gayi.");
      setBooking((prev) =>
        prev ? { ...prev, date, slot, note } : prev
      );
    } catch (e: any) {
      setSaveError(e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading booking…
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <div className="max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <p className="text-base font-semibold text-slate-900">
            Edit booking
          </p>
          <p className="text-xs text-red-600">
            {loadError || "Booking not found."}
          </p>
          <a
            href="/my-bookings"
            className="inline-flex items-center justify-center mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            Back to My Bookings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Edit booking
          </p>
          <p className="text-[11px] text-slate-500">
            Booking ID: <span className="font-mono">{booking.id}</span>
          </p>
        </div>
        <a
          href="/my-bookings"
          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
        >
          Back to My Bookings
        </a>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Summary */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Service
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {booking.categoryName || booking.serviceType || "Service"}
          </p>
          <p className="text-[11px] text-slate-700">
            {booking.itemName || "Job details as discussed"}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-800 mb-1 block">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-800 mb-1 block">
              Time slot
            </label>
            <input
              type="text"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Example: 11 AM – 1 PM"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-800 mb-1 block">
              Additional note (optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Example: Preferred landmark, access instructions, etc."
            />
          </div>

          {cannotReason && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {cannotReason}
            </div>
          )}

          {saveError && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {saveSuccess}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit || saving}
            className="w-full py-2.5 rounded-full text-white font-semibold text-xs shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
