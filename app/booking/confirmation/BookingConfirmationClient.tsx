// app/booking/confirmation/BookingConfirmationClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  paymentStatus?: string; // "pending" | "paid" | "failed" | ...
  paymentGateway?: string;
  paymentOrderId?: string;
  paymentLink?: string;
  createdAt?: number;
};

function BookingConfirmationClient() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id") || "";
  const cfOrderId = searchParams.get("cf_order_id") || "";
  const cfStatus = searchParams.get("cf_status") || "";
  const source = searchParams.get("source") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [paymentMode, setPaymentMode] = useState<"online" | "cod">("cod");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");

  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const isPaid =
    booking?.paymentStatus === "paid" ||
    booking?.paymentStatus === "success" ||
    booking?.paymentStatus === "completed";

  // ---------------- Booking fetch ----------------
  useEffect(() => {
    if (!bookingId) {
      setLoadError("Invalid booking link. ID missing hai.");
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
        setPhone(data.booking.phone || "");
        setEmail(data.booking.email || "");

        if (data.booking.paymentPreference === "online") {
          setPaymentMode("online");
        } else if (data.booking.paymentPreference === "cod") {
          setPaymentMode("cod");
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || "Booking fetch error.");
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

  // --------------- Cashfree callback label ---------------
  const cfStatusLabel = useMemo(() => {
    if (!cfStatus) return "";
    if (cfStatus.toLowerCase().includes("success"))
      return "Payment success callback received.";
    if (cfStatus.toLowerCase().includes("failed"))
      return "Payment failed / cancelled.";
    if (cfStatus.toLowerCase().includes("pending"))
      return "Payment is pending at gateway.";
    return `Payment status: ${cfStatus}`;
  }, [cfStatus]);

  // --------------- Verify payment (not yet paid) ---------------
  useEffect(() => {
    if (!bookingId) return;
    if (!booking) return;

    console.log(
      "BookingConfirmation verify-effect → bookingId, source, paymentStatus:",
      bookingId,
      source,
      booking.paymentStatus
    );

    if (
      booking.paymentStatus === "paid" ||
      booking.paymentStatus === "success" ||
      booking.paymentStatus === "completed"
    ) {
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        setVerifyingPayment(true);
        setVerifyMessage("");

        const res = await fetch("/api/cashfree/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });

        const data = await res.json();
        if (cancelled) return;

        console.log("Cashfree verify response (frontend):", data);

        if (!res.ok || !data.success) {
          setVerifyMessage(
            data.error ||
              "Payment status verify nahi ho paaya. Team manually confirm karegi."
          );
          return;
        }

        setBooking((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: data.paymentStatus || prev.paymentStatus,
              }
            : prev
        );

        if (data.paymentStatus === "paid") {
          setVerifyMessage("✅ Payment successful. Thank you!");
        } else if (data.paymentStatus === "failed") {
          setVerifyMessage(
            "❌ Payment failed ya expire ho gaya. Aap dobara try kar sakte hain."
          );
        } else {
          setVerifyMessage(
            "ℹ️ Payment abhi pending dikh raha hai. Bank/Gateway confirm hone ke baad status update hoga."
          );
        }
      } catch (e: any) {
        if (!cancelled) {
          setVerifyMessage(
            e?.message ||
              "Payment verify karte waqt error aaya. Team manually confirm karegi."
          );
        }
      } finally {
        if (!cancelled) {
          setVerifyingPayment(false);
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [bookingId, booking, source]);

  // --------------- Create payment link ---------------
  async function handleCreateOrder() {
    setPayError("");
    setPaySuccess("");

    if (!bookingId) {
      setPayError("Booking ID missing hai.");
      return;
    }

    if (isPaid) {
      setPayError("Payment already completed for this booking.");
      return;
    }

    const digits = phone.replace(/\D/g, "");

    try {
      setCreatingOrder(true);

      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          phone: digits.length >= 10 ? digits : undefined,
          email: email || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error("Cashfree create-order error:", data);
        setPayError(
          data.error ||
            "Payment create nahi ho paaya. Thodi der baad try karein ya cash par choose karein."
        );
        return;
      }

      const paymentLink = data.paymentLink;
      if (!paymentLink) {
        setPayError("Payment link not received from Cashfree (frontend).");
        return;
      }

      setPaySuccess("Payment link open ho raha hai…");
      window.location.href = paymentLink;
    } catch (e: any) {
      console.error("handleCreateOrder exception:", e);
      setPayError(e?.message || "Unexpected error while creating payment.");
    } finally {
      setCreatingOrder(false);
    }
  }

  // --------------- COD preference ---------------
  async function handleConfirmCOD() {
    setPayError("");
    setPaySuccess("");

    if (!bookingId) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: booking?.status || "pending",
          paymentPreference: "cod",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "COD preference update nahi ho paayi.");
      }

      setPaySuccess(
        "Cash on service selected. Engineer visit ke time par payment kar sakte hain."
      );

      setBooking((prev) =>
        prev
          ? {
              ...prev,
              paymentPreference: "cod",
              paymentStatus: prev.paymentStatus || "pending",
            }
          : prev
      );
    } catch (e: any) {
      setPayError(e?.message || "COD update error.");
    }
  }

  // --------------- UI states ---------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading your booking details…
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
        <div className="max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <p className="text-base font-semibold text-slate-900">
            Booking not found
          </p>
          <p className="text-xs text-red-600">
            {loadError || "Unable to find your booking."}
          </p>
          <a
            href="/book"
            className="inline-flex items-center justify-center mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            Back to booking
          </a>
        </div>
      </div>
    );
  }

  // ----------------- UI (layout similar to screenshot) -----------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Booking confirmation
          </p>
          <p className="text-[11px] text-slate-500">
            Booking ID: <span className="font-mono">{booking.id}</span>
          </p>
          {cfStatusLabel && (
            <p className="text-[11px] text-blue-600 mt-0.5">
              {cfStatusLabel}
            </p>
          )}
        </div>
        <a
          href="/"
          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
        >
          Back to home
        </a>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
        {/* Service & appointment summary – compact cards (similar vibe) */}
        <div className="space-y-3">
          {/* Service & job type */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-sm flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Service & job type
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {booking.categoryName || booking.serviceType || "Service"}
            </p>
            <p className="text-xs text-slate-700">
              {booking.itemName || "Exact job as discussed with technician"}
            </p>
            {booking.approxPrice && (
              <p className="mt-1 text-xs text-blue-700 font-semibold">
                Est. charges: {booking.approxPrice}
              </p>
            )}
          </div>

          {/* Appointment */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-sm flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Appointment
            </p>
            <p className="text-xs text-slate-900 font-semibold">
              {booking.date || "Date not set"}
              {booking.slot && (
                <>
                  {" "}
                  • <span>{booking.slot}</span>
                </>
              )}
            </p>
            <p className="text-xs text-slate-600">
              Arrival window may vary by 15–30 mins depending on traffic.
            </p>
          </div>

          {/* Customer */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-sm flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Customer
            </p>
            <p className="text-xs font-semibold text-slate-900">
              {booking.customerName || "Customer"}
            </p>
            <p className="text-xs text-slate-700 flex items-center gap-2">
              <span>📞 {booking.phone || phone || "—"}</span>
            </p>
            <p className="text-xs text-slate-700">
              ✉️ {booking.email || email || "—"}
            </p>
          </div>

          {/* Address */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-sm flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Address
            </p>
            <p className="text-xs text-slate-900 whitespace-pre-line">
              {booking.addressLine1 && <>{booking.addressLine1}</>}
              {booking.addressLine2 && (
                <>
                  {"\n"}
                  {booking.addressLine2}
                </>
              )}
              {!booking.addressLine1 && !booking.addressLine2 && (
                <>
                  {booking.city || "City not set"}
                  {booking.pincode && ` – ${booking.pincode}`}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Payment card like screenshot */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Payment options
              </p>
              <p className="text-[11px] text-slate-500">
                Choose how you’d like to pay for this service
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${
                isPaid
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : booking.paymentStatus === "failed"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {isPaid
                ? "Paid"
                : booking.paymentStatus === "failed"
                ? "Failed"
                : booking.paymentStatus || "Pending"}
            </span>
          </div>

          {/* Default: Pay after service */}
          <div className="border border-slate-200 rounded-2xl p-3 mb-3 bg-slate-50/80">
            <p className="text-[11px] font-semibold text-slate-900 mb-1">
              Pay after service (default)
            </p>
            <p className="text-[11px] text-slate-600">
              Technician visit ke baad cash, UPI, card ya bank transfer se
              payment kar sakte hain. Invoice WhatsApp / SMS par share ki
              jayegi.
            </p>
            <button
              type="button"
              onClick={handleConfirmCOD}
              disabled={isPaid}
              className="mt-2 inline-flex items-center px-3 py-1.5 rounded-full border text-[11px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed border-slate-300 text-slate-700 bg-white hover:bg-slate-100"
            >
              {isPaid ? "COD not needed (paid)" : "Keep pay-after-service"}
            </button>
          </div>

          {/* Pay online now (Cashfree) */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/80">
            <p className="text-[11px] font-semibold text-slate-900 mb-1">
              Pay online now (Cashfree)
            </p>
            <p className="text-[11px] text-slate-600 mb-3">
              Secure UPI / card / netbanking via Cashfree payment gateway.
            </p>

            <button
              type="button"
              onClick={isPaid ? undefined : handleCreateOrder}
              disabled={isPaid || creatingOrder}
              className={`w-full py-2.5 rounded-full text-white font-semibold text-xs shadow-md disabled:cursor-not-allowed ${
                isPaid ? "bg-emerald-500 opacity-90" : "cursor-pointer"
              }`}
              style={
                isPaid
                  ? {}
                  : {
                      background:
                        "linear-gradient(90deg, #0062E1, #00B0FF)",
                    }
              }
            >
              {isPaid
                ? "Paid ✅"
                : creatingOrder
                ? "Creating payment link..."
                : "Pay online now (recommended)"}
            </button>
          </div>

          {/* Error / success */}
          {payError && (
            <div className="mt-3 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {payError}
            </div>
          )}
          {paySuccess && (
            <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {paySuccess}
            </div>
          )}
          {(verifyingPayment || verifyMessage) && (
            <div className="mt-3 text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              {verifyingPayment ? (
                <p className="text-slate-600">
                  Payment status verify kiya ja raha hai…
                </p>
              ) : (
                <p className="text-slate-700">{verifyMessage}</p>
              )}
            </div>
          )}

          {/* WhatsApp help */}
          <div className="mt-4 border border-slate-100 rounded-2xl px-3 py-2 bg-slate-50/80 text-[10px] text-slate-500">
            <p className="font-semibold text-[11px] mb-1">
              Agar payment link me koi issue aaye ya aapko manual UPI link
              chahiye ho, WhatsApp par message bhejein:
            </p>
            <a
              href="https://wa.me/918851543700"
              target="_blank"
              className="inline-flex items-center mt-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-500 text-white shadow-sm"
            >
              🟢 Chat on WhatsApp (8851543700)
            </a>
          </div>

          {/* Navigation buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-100"
            >
              ⬅ Back to home
            </a>
            <a
              href="/book"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
              }}
            >
              + Book another service
            </a>
            <a
              href="/my-bookings"
              className="inline-flex mt-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-slate-300 text-slate-700"
            >
              View all my bookings
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BookingConfirmationClient;
