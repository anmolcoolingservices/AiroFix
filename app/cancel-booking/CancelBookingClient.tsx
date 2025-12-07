// app/cancel-booking/CancelBookingClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Booking = {
  id: string;
  customerName?: string;
  phone?: string;
  date?: string;
  slot?: string;
  status?: string;
  startTs?: number;
  scheduledAt?: number;
};

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function CancelBookingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get("id") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [isTooClose, setIsTooClose] = useState(false);

  // ---------- Booking fetch ----------
  useEffect(() => {
    if (!bookingId) {
      setLoadError("Booking ID missing hai.");
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

        const b = data.booking as Booking;
        setBooking(b);

        // 12 ghante rule client-side info ke liye
        const now = Date.now();
        const slotStartTs =
          typeof (b.startTs as number) === "number"
            ? (b.startTs as number)
            : typeof (b.scheduledAt as number) === "number"
            ? (b.scheduledAt as number)
            : null;

        if (slotStartTs) {
          const diff = slotStartTs - now;
          if (diff < TWELVE_HOURS_MS) {
            setIsTooClose(true);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || "Booking fetch error.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // ---------- Cancel submit ----------
  async function handleCancel() {
    setSubmitError("");
    setSubmitSuccess("");

    if (!bookingId) {
      setSubmitError("Booking ID missing hai.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // 12 ghante rule (server se aa raha hai)
        if (data.code === "TOO_CLOSE_TO_SLOT") {
          setIsTooClose(true);
        }
        throw new Error(
          data.error ||
            "Booking cancel karte waqt error aaya. Thodi der baad try karein."
        );
      }

      setSubmitSuccess("✅ Booking successfully cancelled.");
      // Local state update
      setBooking((prev) =>
        prev ? { ...prev, status: data.newStatus || "cancelled_by_customer" } : prev
      );

      // Optional: thodi der baad redirect
      setTimeout(() => {
        router.push("/my-bookings");
      }, 1500);
    } catch (e: any) {
      setSubmitError(e?.message || "Booking cancel nahi ho paayi.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- UI states ----------
  if (!bookingId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3 text-center">
          <p className="text-base font-semibold text-slate-900">
            Invalid cancellation link
          </p>
          <p className="text-xs text-slate-600">
            Booking ID missing hai. Kripya WhatsApp ya call se team se contact
            karein.
          </p>
          <a
            href="/my-bookings"
            className="inline-flex items-center justify-center mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            View my bookings
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading cancellation details…
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3 text-center">
          <p className="text-base font-semibold text-slate-900">
            Booking not found
          </p>
          <p className="text-xs text-red-600">
            {loadError || "Booking details nahi mil paaye."}
          </p>
          <a
            href="/my-bookings"
            className="inline-flex items-center justify-center mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            Back to my bookings
          </a>
        </div>
      </div>
    );
  }

  const alreadyCancelled =
    (booking.status || "").toLowerCase().includes("cancelled");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
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
          Back to my bookings
        </a>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Booking summary card */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Appointment details
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {booking.customerName || "Customer"}{" "}
            <span className="text-[11px] text-slate-500">
              ({booking.phone || "—"})
            </span>
          </p>
          <p className="text-xs text-slate-800">
            {booking.date || "Date not set"}
            {booking.slot && (
              <>
                {" "}
                • <span>{booking.slot}</span>
              </>
            )}
          </p>
          <p className="text-[11px] text-slate-500">
            Current status:{" "}
            <span className="font-semibold text-slate-800">
              {booking.status || "pending"}
            </span>
          </p>

          {isTooClose && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              Ye booking ab cancel nahi ki ja sakti, kyunki appointment time se
              12 ghante se kam samay bacha hai. Kripya support team se WhatsApp /
              call ke through contact karein.
            </div>
          )}

          {alreadyCancelled && (
            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              Ye booking pehle hi cancel ho chuki hai.
            </div>
          )}
        </section>

        {/* Cancel form */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            Confirm cancellation
          </p>
          <p className="text-[11px] text-slate-600">
            Aap booking cancel kar rahe hain. Engineer ko slot block kiya gaya
            hota hai, isliye please genuine cases me hi cancellation karein.
          </p>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">
              Cancellation reason (optional)
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
              placeholder="Example: Plan change ho gaya / Technician timing suit nahi kar rahi / Issue khud se resolve ho gaya, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting || alreadyCancelled || isTooClose}
            />
          </div>

          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting || alreadyCancelled || isTooClose}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, #f97316, #dc2626)", // orange → red
            }}
          >
            {alreadyCancelled
              ? "Already cancelled"
              : isTooClose
              ? "Cancellation not allowed"
              : submitting
              ? "Cancelling…"
              : "Yes, cancel this booking"}
          </button>

          {submitError && (
            <div className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {submitSuccess} Redirecting to your bookings…
            </div>
          )}
        </section>

        {/* WhatsApp help */}
        <section className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-600">
          <p className="font-semibold text-[11px] mb-1">
            Help chahiye ya 12 ghante ke andar urgent cancellation hai?
          </p>
          <p>
            Aap directly WhatsApp par humse baat kar sakte hain. Team aapki
            booking ko manual review karegi.
          </p>
          <a
            href="https://wa.me/918851543700"
            target="_blank"
            className="inline-flex items-center mt-2 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-500 text-white shadow-sm"
          >
            🟢 Chat on WhatsApp (8851543700)
          </a>
        </section>
      </main>
    </div>
  );
}

export default CancelBookingClient;
