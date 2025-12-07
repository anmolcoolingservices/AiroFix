"use client";

import { useEffect, useState, useMemo } from "react";
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
  pincode?: string;
  status?: string;
  paymentPreference?: "online" | "cod";
  paymentStatus?: string; // "pending" | "paid" | "failed" | ...
  paymentGateway?: string;
  paymentOrderId?: string;
  paymentLink?: string;
  createdAt?: number;
};

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id") || "";
  const cfOrderId = searchParams.get("cf_order_id") || "";
  const cfStatus = searchParams.get("cf_status") || "";
  const source = searchParams.get("source") || ""; // optional cashfree_link

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

  // ---- Booking fetch ----
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

  // ---- Cashfree callback status message (optional info chip) ----
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

  // ---- Verify payment: booking ke base par (not yet paid) ----
  useEffect(() => {
    if (!bookingId) return;
    if (!booking) return;

    // Debug log – browser console me dekho
    console.log(
      "BookingConfirmation verify-effect → bookingId, source, paymentStatus, gateway:",
      bookingId,
      source,
      booking.paymentStatus,
      booking.paymentGateway
    );

    // Agar already paid hai to verify ki zarurat nahi
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

        // Booking state update
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

  // ---- Handle Online Payment ----
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

  // ---- COD selection ----
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

  // ---- UI ----
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
          {booking.paymentStatus && (
            <p className="text-[11px] mt-0.5">
              Payment status:{" "}
              <span
                className={
                  isPaid
                    ? "text-emerald-600 font-semibold"
                    : booking.paymentStatus === "failed"
                    ? "text-red-600 font-semibold"
                    : "text-slate-700"
                }
              >
                {booking.paymentStatus}
              </span>
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-5 space-y-4">
        {/* Top thank-you */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-sm">
          <p className="font-semibold text-slate-900">
            Thank you, {booking.customerName || "Customer"}! 🎉
          </p>
          <p className="text-[12px] text-slate-600 mt-1">
            Aapki booking receive ho chuki hai. AiroFix team aapko WhatsApp /
            call ke through slot confirm karegi.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.1fr,0.9fr] items-start">
          {/* LEFT: Booking summary */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Booking summary
              </p>
              <p className="text-[11px] text-slate-500">
                Service details, slot & address
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/80 space-y-1">
              <p className="text-[11px] text-slate-500">Service</p>
              <p className="text-[13px] font-semibold text-slate-900">
                {booking.categoryName || booking.serviceType || "—"}
              </p>
              <p className="text-[11px] text-slate-700">
                {booking.itemName ||
                  "Exact job as discussed with technician"}
              </p>
              {booking.approxPrice && (
                <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                  Est. {booking.approxPrice}
                </p>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/80 space-y-1">
              <p className="text-[11px] text-slate-500">Appointment</p>
              <p className="text-[11px] text-slate-900">
                {booking.date || "Date not set"}{" "}
                {booking.slot && (
                  <>
                    • <span className="font-semibold">{booking.slot}</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-600">
                Exact arrival time traffic conditions ke hisaab se thoda vary ho
                sakta hai (±15–30 mins).
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/80 space-y-1">
              <p className="text-[11px] text-slate-500">Address</p>
              <p className="text-[11px] text-slate-900">
                {booking.city || "City not set"}{" "}
                {booking.pincode && <>- {booking.pincode}</>}
              </p>
              <p className="text-[11px] text-slate-600">
                Technician aapko call / WhatsApp karega gate / exact location
                coordinate karne ke liye.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/80 space-y-1">
              <p className="text-[11px] text-slate-500">Your contact</p>
              <div className="grid gap-1 sm:grid-cols-2">
                <input
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] bg-white"
                  placeholder="Phone (optional edit)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPaid}
                />
                <input
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] bg-white"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPaid}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Aap yahan phone / email update kar sakte hain. Payment ke time
                ye details use ho sakti hain.
              </p>
            </div>
          </section>

          {/* RIGHT: Payment options */}
          <aside className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Payment preference
              </p>
              <p className="text-[11px] text-slate-500">
                {isPaid
                  ? "Payment received. Neeche details dekh sakte hain."
                  : "Abhi select karein: online ya cash on service"}
              </p>
            </div>

            {/* Agar payment already ho chuka hai */}
            {isPaid ? (
              <div className="space-y-2 border border-emerald-200 rounded-xl px-3 py-2 bg-emerald-50/60">
                <p className="text-[11px] text-emerald-800 font-semibold">
                  ✅ Online payment completed via Cashfree.
                </p>
                <p className="text-[11px] text-emerald-700">
                  Aapko alag se payment receipt / confirmation SMS / email bhi
                  mil sakta hai. Engineer visit ke time par aapko sirf service
                  ka reference dena hoga.
                </p>
              </div>
            ) : (
              <>
                {/* Mode buttons */}
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("online")}
                    className={`flex-1 rounded-xl border px-3 py-1.5 font-semibold ${
                      paymentMode === "online"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    💳 Pay online (UPI/card)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("cod")}
                    className={`flex-1 rounded-xl border px-3 py-1.5 font-semibold ${
                      paymentMode === "cod"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    💵 Cash on service
                  </button>
                </div>

                {paymentMode === "online" && (
                  <div className="space-y-2 border border-blue-100 rounded-xl px-3 py-2 bg-blue-50/40">
                    <p className="text-[11px] text-slate-700">
                      Aapko Cashfree gateway par redirect kiya jayega jahan aap
                      UPI, card ya netbanking se secure payment kar sakte hain.
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateOrder}
                      disabled={creatingOrder}
                      className="w-full py-2 rounded-xl text-white font-semibold text-xs shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, #0E63C8, #00B3FF)",
                      }}
                    >
                      {creatingOrder
                        ? "Creating payment link..."
                        : "Pay online now"}
                    </button>
                  </div>
                )}

                {paymentMode === "cod" && (
                  <div className="space-y-2 border border-emerald-100 rounded-xl px-3 py-2 bg-emerald-50/40">
                    <p className="text-[11px] text-slate-700">
                      Aap service complete hone ke baad cash / UPI / QR se
                      on-site payment kar sakte hain. No advance required.
                    </p>
                    <button
                      type="button"
                      onClick={handleConfirmCOD}
                      className="w-full py-2 rounded-xl text-emerald-900 font-semibold text-xs border border-emerald-300 bg-emerald-100 hover:bg-emerald-200"
                    >
                      Confirm cash on service
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Messages */}
            {payError && (
              <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {payError}
              </div>
            )}
            {paySuccess && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {paySuccess}
              </div>
            )}

            {(verifyingPayment || verifyMessage) && (
              <div className="text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                {verifyingPayment ? (
                  <p className="text-slate-600">
                    Payment status verify kiya ja raha hai…
                  </p>
                ) : (
                  <p className="text-slate-700">{verifyMessage}</p>
                )}
              </div>
            )}

            <div className="border border-slate-100 rounded-xl px-3 py-2 bg-slate-50/80 text-[10px] text-slate-500">
              <p className="font-semibold text-[11px] mb-1">
                Need help with payment?
              </p>
              <p>
                WhatsApp pe billing / payment ke related doubt pooch sakte hain:
              </p>
              <a
                href="https://wa.me/918851543700"
                target="_blank"
                className="inline-flex mt-1 text-blue-600 font-semibold underline"
              >
                Chat on WhatsApp
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
