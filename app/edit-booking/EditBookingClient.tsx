// app/edit-booking/EditBookingClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Booking = {
  id: string;
  customerName?: string;
  phone?: string;
  email?: string;
  serviceType?: string;
  categoryName?: string;
  itemName?: string;
  approxPrice?: string;
  date?: string;
  slot?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  status?: string;
  paymentPreference?: "online" | "cod";
  startTs?: number;
  scheduledAt?: number;
};

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function EditBookingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("id") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Editable fields
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

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

        // Prefill form
        setCustomerName(b.customerName || "");
        setPhone(b.phone || "");
        setDate(b.date || "");
        setSlot(b.slot || "");
        setAddressLine1(b.addressLine1 || "");
        setAddressLine2(b.addressLine2 || "");
        setCity(b.city || "");
        setPincode(b.pincode || "");

        // 12 ghante rule
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

  const isLockedStatus = (() => {
    const s = (booking?.status || "").toLowerCase();
    // yahan tum apne rules daal sakte ho – filhaal sirf completed / cancelled lock
    if (s.includes("completed") || s.includes("cancelled")) return true;
    return false;
  })();

  // ---------- Submit edit ----------
  async function handleSave() {
    setSubmitError("");
    setSubmitSuccess("");

    if (!bookingId) {
      setSubmitError("Booking ID missing hai.");
      return;
    }

    if (!customerName || !phone) {
      setSubmitError("Name aur phone required hain.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          date,
          slot,
          addressLine1,
          addressLine2,
          city,
          pincode,
          // status change nahi kar rahe customer se
          status: booking?.status || "pending",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "Booking update karte waqt error aaya. Thodi der baad try karein."
        );
      }

      setSubmitSuccess("✅ Booking details updated successfully.");
      // Local state update
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              customerName,
              phone,
              date,
              slot,
              addressLine1,
              addressLine2,
              city,
              pincode,
            }
          : prev
      );

      // Thodi der baad redirect to my-bookings
      setTimeout(() => {
        router.push("/my-bookings");
      }, 1500);
    } catch (e: any) {
      setSubmitError(e?.message || "Booking update nahi ho paayi.");
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
            Invalid edit link
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
        Loading booking for edit…
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
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
          Back to my bookings
        </a>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Info about rules */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            Booking edit rules
          </p>
          <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
            <li>OTP ki zaroorat nahi hai – sirf aapke mobile link se edit.</li>
            <li>
              Appointment time se 12 ghante se kam bache honge to major changes
              allowed nahi honge.
            </li>
            <li>
              Completed / cancelled bookings edit nahi ki ja sakti – sirf nayi
              booking create karein.
            </li>
          </ul>

          {isTooClose && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              Appointment time se 12 ghante se kam samay bacha hai, isliye kuch
              edits restricted ho sakte hain. Agar urgent change hai to
              WhatsApp par team se baat karein.
            </div>
          )}

          {isLockedStatus && (
            <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
              Ye booking ka status{" "}
              <span className="font-semibold">{booking.status}</span> hai, isliye
              customer side se edit allowed nahi hai.
            </div>
          )}
        </section>

        {/* Edit form */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Full name
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={submitting || isLockedStatus}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder="Your name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Mobile number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting || isLockedStatus}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder="10-digit mobile"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Preferred date
              </label>
              <input
                type="date"
                value={date || ""}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting || isLockedStatus}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Time slot
              </label>
              <input
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                disabled={submitting || isLockedStatus}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder="e.g. 10am–12pm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">
              Address line 1
            </label>
            <input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              disabled={submitting || isLockedStatus}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
              placeholder="House no., street"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-700">
              Address line 2 (optional)
            </label>
            <input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              disabled={submitting || isLockedStatus}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
              placeholder="Landmark, area"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                City
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={submitting || isLockedStatus}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder="City"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Pincode
              </label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                disabled={submitting || isLockedStatus}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder="Pincode"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || isLockedStatus}
            className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            {isLockedStatus
              ? "Editing locked for this booking"
              : submitting
              ? "Saving changes…"
              : "Save changes"}
          </button>

          {submitError && (
            <div className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {submitSuccess} Redirecting…
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default EditBookingClient;
