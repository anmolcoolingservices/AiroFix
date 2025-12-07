// app/cancel-booking/page.tsx
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
  paymentStatus?: string;
  startTs?: number;   // optional, for 12h rule
  slotTs?: number;    // fallback
};

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export default function CancelBookingPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setLoadError("Invalid cancel link – booking ID missing.");
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
        setBooking(data.booking);
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

  // 12 hours rule + status based allowed flag
  const { canCancel, cannotReason } = useMemo(() => {
    if (!booking) {
      return { canCancel: false, cannotReason: "" };
    }

    // Already cancelled / completed
    if (
      booking.status === "cancelled" ||
      booking.status === "completed" ||
      booking.status === "closed"
    ) {
      return {
        canCancel: false,
        cannotReason:
          "Ye booking already completed / cancelled hai. Ab cancel nahi ho sakti.",
      };
    }

    const now = Date.now();
    const startTs = booking.startTs || booking.slotTs;

    if (startTs && startTs - now < TWELVE_HOURS_MS) {
      return {
        canCancel: false,
        cannotReason:
          "Visit ke 12 ghante se kam time bacha hai, isliye booking cancel nahi ho sakti. Agar urgent hai to support se WhatsApp / call karein.",
      };
    }

    return { canCancel: true, cannotReason: "" };
  }, [booking]);

  async function handleCancel() {
    if (!bookingId || !booking) return;
    setSubmitError("");
    setSubmitSuccess("");

    if (!canCancel) {
      setSubmitError(
        cannotReason ||
          "Is booking ko rules ke hisaab se cancel nahi kiya ja sakta."
      );
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "Booking cancel karte waqt problem aayi. Thodi der baad try karein."
        );
      }

      setSubmitSuccess(
        "Booking cancel ho gayi. AiroFix team ko notification mil gaya hai."
      );
      setBooking((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    } catch (e: any) {
      setSubmitError(e?.message || "Cancel request failed.");
    } finally {
      setSubmitting(false);
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
            Cancel booking
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
            Cancel booking
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
        {/* Summary card */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
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
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
              {booking.status}
            </span>
          </div>

          <div className="text-[11px] text-slate-700 mt-2">
            <p>
              <span className="font-semibold">Appointment:</span>{" "}
              {booking.date || "Date not set"}{" "}
              {booking.slot && <>• {booking.slot}</>}
            </p>
            {booking.approxPrice && (
              <p className="mt-1">
                <span className="font-semibold">Approx. charges:</span>{" "}
                {booking.approxPrice}
              </p>
            )}
          </div>
        </div>

        {/* Info about 12 hours rule */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-[11px] text-amber-800">
          <p className="font-semibold mb-1">Cancellation policy</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Visit ke 12 hours se kam time bacha ho to booking cancel nahi hogi.</li>
            <li>Completed / cancelled bookings ko dobara cancel nahi kiya ja sakta.</li>
            <li>Agar aapne online payment kiya hai to refund AiroFix team handle karegi.</li>
          </ul>
        </div>

        {/* Reason + actions */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-800 mb-1">
              Reason for cancellation (optional)
            </p>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Example: Plan change ho gaya, slot suitable nahi hai, etc."
            />
          </div>

          {cannotReason && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {cannotReason}
            </div>
          )}

          {submitError && (
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {submitSuccess}
            </div>
          )}

          <button
            type="button"
            onClick={handleCancel}
            disabled={!canCancel || submitting}
            className="w-full py-2.5 rounded-full text-white font-semibold text-xs shadow-md disabled:opacity-60 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
          >
            {submitting ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </div>
      </main>
    </div>
  );
}
