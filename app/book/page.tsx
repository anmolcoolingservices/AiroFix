"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  type: "ac" | "electrician" | "other";
  basePrice?: string;
  isActive?: boolean; // new: support old flag
  enabled?: boolean; // new: support seed/admin flag
};

type SubService = {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  priceFrom?: string;
  priceTo?: string;
  approxDuration?: string;
  isActive?: boolean; // new
  enabled?: boolean; // new
};

const TIME_SLOTS = [
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 01:00 PM",
  "02:00 PM – 03:00 PM",
  "03:00 PM – 04:00 PM",
  "04:00 PM – 05:00 PM",
  "05:00 PM – 06:00 PM",
];

export default function BookPage() {
  const router = useRouter();

  // master data
  const [services, setServices] = useState<Service[]>([]);
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState("");

  // form state
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedSubServiceId, setSelectedSubServiceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");

  // 🔹 Payment preference: store only intention, actual payment confirmation page par hoga
  const [paymentPreference, setPaymentPreference] = useState<
    "cash_later" | "online_now"
  >("cash_later");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);

  // load services + sub-services from admin APIs
  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      try {
        setLoadingMeta(true);
        setMetaError("");

        const [sRes, ssRes] = await Promise.all([
          fetch("/api/admin/services"),
          fetch("/api/admin/sub-services"),
        ]);

        const sJson = await sRes.json();
        const ssJson = await ssRes.json();

        if (!sRes.ok || !sJson.success) {
          throw new Error(sJson.error || "Failed to load services");
        }
        if (!ssRes.ok || !ssJson.success) {
          throw new Error(ssJson.error || "Failed to load sub-services");
        }

        if (cancelled) return;

        // IMPORTANT: respect both isActive and enabled
        const rawServices: Service[] = sJson.services || [];
        const rawSubServices: SubService[] = ssJson.subServices || [];

        const activeServices: Service[] = rawServices.filter((s) => {
          const flag = s.isActive ?? s.enabled ?? true;
          return flag !== false;
        });

        const activeSubServices: SubService[] = rawSubServices.filter((ss) => {
          const flag = ss.isActive ?? ss.enabled ?? true;
          return flag !== false;
        });

        setServices(activeServices);
        setSubServices(activeSubServices);

        // default select first service if available
        if (activeServices.length && !selectedServiceId) {
          setSelectedServiceId(activeServices[0].id);
        }
      } catch (err: any) {
        if (!cancelled) {
          setMetaError(
            err?.message || "Unable to load services. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    }

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [selectedServiceId]);

  // filtered sub-services for selected service
  const filteredSubServices = useMemo(() => {
    if (!selectedServiceId) return [];
    return subServices.filter((ss) => ss.serviceId === selectedServiceId);
  }, [subServices, selectedServiceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  const selectedSubService = useMemo(
    () =>
      filteredSubServices.find((ss) => ss.id === selectedSubServiceId) ||
      filteredSubServices[0],
    [filteredSubServices, selectedSubServiceId]
  );

  // date min = today
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // basic validation
  function validate(): string | null {
    if (!customerName.trim()) return "Please enter your name.";
    if (!phone.trim() || phone.trim().length < 10)
      return "Please enter a valid mobile number.";
    if (!selectedService) return "Please select a service.";
    if (!selectedSubService) return "Please select a specific job.";
    if (!date) return "Please select a date.";
    if (!slot) return "Please choose a time slot.";
    if (!address1.trim()) return "Please enter address / house details.";
    if (!city.trim()) return "Please enter city / locality.";
    if (!pincode.trim()) return "Please enter pincode.";
    return null;
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setSubmitError("");
    setSuccessId(null);

    const err = validate();
    if (err) {
      setSubmitError(err);
      return;
    }

    try {
      setSubmitting(true);

      const approxPrice = selectedSubService
        ? selectedSubService.priceFrom || selectedSubService.priceTo
          ? `₹${selectedSubService.priceFrom || ""}${
              selectedSubService.priceTo
                ? ` – ₹${selectedSubService.priceTo}`
                : ""
            }`
          : ""
        : "";

      const body = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        serviceType: selectedService?.type || "",
        categoryName: selectedService?.name || "",
        itemName: selectedSubService?.name || "",
        approxPrice,
        addressLine1: address1.trim(),
        addressLine2: address2.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        date,
        slot,
        notes: notes.trim(),
        source: "web",
        // 🔹 store payment preference with booking
        paymentMode: paymentPreference,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Booking failed, please try again.");
      }

      const bookingId: string =
        data.id || data.booking?.id || data.bookingId || "created";

      setSuccessId(bookingId);

      // reset basic fields but keep service selection
      setCustomerName("");
      setPhone("");
      setEmail("");
      setDate("");
      setSlot("");
      setAddress1("");
      setAddress2("");
      setCity("");
      setPincode("");
      setNotes("");
      setSelectedSubServiceId("");

      // 🔥 Redirect to confirmation screen for payment + final info
      if (bookingId && bookingId !== "created") {
        router.push(`/booking/confirmation?id=${bookingId}`);
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function getServiceIcon(s: Service) {
    if (s.type === "ac") return "❄️";
    if (s.type === "electrician") return "💡";
    return "🔧";
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-950/5">
      {/* MOVING BACKGROUND GRADIENT */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,#2563eb33,transparent_55%),radial-gradient(circle_at_bottom_right,#22d3ee33,transparent_55%),linear-gradient(135deg,#eff6ff,#e0f2fe,#eff6ff)] bg-[length:200%_200%] animate-bgFlow" />

      {/* FLOATING ORBS */}
      <div className="pointer-events-none fixed -top-10 left-0 h-52 w-52 rounded-full bg-blue-300/40 blur-3xl animate-orbFloat" />
      <div className="pointer-events-none fixed bottom-0 right-[-40px] h-64 w-64 rounded-full bg-cyan-300/40 blur-3xl animate-orbFloat2" />

      {/* HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* back to home */}
            <a
              href="/"
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 text-lg hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
              aria-label="Back to home"
            >
              ←
            </a>
            <a
              href="/"
              className="sm:hidden h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 bg-white/80 text-xs text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
              aria-label="Back to home"
            >
              ←
            </a>

            {/* logo + brand */}
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10 rounded-2xl bg-white/90 border border-slate-200 shadow-[0_10px_25px_rgba(37,99,235,0.45)] overflow-hidden animate-logoPop flex items-center justify-center">
                <Image
                  src="/airofix-logo.png"
                  alt="AiroFix"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight text-slate-900">
                  AiroFix
                </p>
                <p className="text-[11px] text-slate-500">
                  Book AC & Electrician – Delhi NCR
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-[11px] leading-tight">
            <span className="text-slate-500">Need help?</span>
            <a
              href="https://wa.me/917289026947"
              target="_blank"
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
            >
              WhatsApp support
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        {/* PAGE HEADING */}
        <div className="mb-5 space-y-1 animate-fadeUp">
          <p className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 shadow-sm backdrop-blur">
            <span className="text-xs">⚡</span>
            <span>App-style booking experience, directly on web</span>
          </p>
          <h1 className="text-[22px] sm:text-2xl font-semibold tracking-tight text-slate-900">
            Book your{" "}
            <span className="text-blue-600">AC service</span> /{" "}
            <span className="text-blue-600">electrician</span> in under a
            minute.
          </h1>
          <p className="text-[13px] text-slate-500">
            Choose service → Pick slot → Add address. AiroFix team handles the
            rest with WhatsApp updates & clear pricing.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr] items-start">
          {/* LEFT – FORM CARD */}
          <section className="relative rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.16)] overflow-hidden animate-slideInLeft">
            {/* gradient overlay */}
            <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-blue-50/90 via-transparent to-transparent" />

            <div className="relative p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Service & schedule
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Slot-based booking • Verified technicians • 10 AM – 6 PM
                  </p>
                </div>
                <span className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                  ⏱ Avg. visit 45–60 mins
                </span>
              </div>

              {metaError && (
                <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 animate-shake">
                  {metaError}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-4 text-xs sm:text-[13px]"
              >
                {/* 1. Service selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 text-xs">
                      1. Choose service
                    </p>
                    <span className="text-[11px] text-slate-400">
                      AC / electrician / other
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {services.map((s) => {
                      const active = selectedServiceId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedServiceId(s.id);
                            setSelectedSubServiceId("");
                          }}
                          className={`group relative rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.18)] overflow-hidden ${
                            active
                              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-[0_16px_40px_rgba(37,99,235,0.45)]"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {active && (
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-400/10" />
                          )}
                          <div className="relative flex items-center gap-1.5">
                            <span className="text-base">
                              {getServiceIcon(s)}
                            </span>
                            <p className="font-semibold truncate">
                              {s.name}
                            </p>
                          </div>
                          {s.basePrice && (
                            <p className="relative text-[11px] text-slate-500 mt-0.5">
                              From {s.basePrice}
                            </p>
                          )}
                        </button>
                      );
                    })}

                    {loadingMeta && (
                      <p className="text-[11px] text-slate-500 col-span-full">
                        Loading services…
                      </p>
                    )}
                    {!loadingMeta && services.length === 0 && (
                      <p className="text-[11px] text-slate-500 col-span-full">
                        No services configured yet. Please contact admin.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Sub-service selection */}
                {selectedService && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-xs">
                        2. Select job type
                      </p>
                      <span className="text-[11px] text-slate-400">
                        General service / deep clean / install / repair
                      </span>
                    </div>

                    {filteredSubServices.length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        No sub-services configured under{" "}
                        <span className="font-semibold">
                          {selectedService.name}
                        </span>
                        . Please contact admin.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {filteredSubServices.map((ss) => {
                          const active =
                            selectedSubServiceId === ss.id ||
                            (!selectedSubServiceId &&
                              selectedSubService?.id === ss.id);
                          return (
                            <button
                              key={ss.id}
                              type="button"
                              onClick={() => setSelectedSubServiceId(ss.id)}
                              className={`relative rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.18)] ${
                                active
                                  ? "border-blue-600 bg-white text-blue-800 shadow-[0_16px_40px_rgba(37,99,235,0.4)]"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                              }`}
                            >
                              {active && (
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-cyan-400/12" />
                              )}
                              <div className="relative space-y-0.5">
                                <p className="font-semibold">{ss.name}</p>
                                {ss.description && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                    {ss.description}
                                  </p>
                                )}
                                <p className="text-[11px] text-blue-700 mt-1 font-semibold">
                                  {ss.priceFrom || ss.priceTo
                                    ? `₹${ss.priceFrom || ""}${
                                        ss.priceTo
                                          ? ` – ₹${ss.priceTo}`
                                          : ""
                                      }`
                                    : "Price as per visit"}
                                  {ss.approxDuration &&
                                    ` • ${ss.approxDuration}`}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Customer details */}
                <div className="space-y-1.5 pt-1">
                  <p className="font-semibold text-slate-800 text-xs">
                    3. Your details
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className="premium-input"
                      placeholder="Full name*"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                      className="premium-input"
                      placeholder="Mobile number*"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <input
                      className="premium-input sm:col-span-2"
                      placeholder="Email (optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* 4. Date + slot */}
                <div className="space-y-1.5 pt-1">
                  <p className="font-semibold text-slate-800 text-xs">
                    4. Date & time slot
                  </p>
                  <div className="grid gap-2 sm:grid-cols-[0.9fr,1.1fr]">
                    <input
                      type="date"
                      min={todayStr}
                      className="premium-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIME_SLOTS.map((t) => {
                        const active = slot === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSlot(t)}
                            className={`rounded-xl border px-2 py-1.5 text-[11px] sm:text-[12px] transition-all duration-200 ${
                              active
                                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm scale-[1.02]"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-blue-500"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. Address */}
                <div className="space-y-1.5 pt-1">
                  <p className="font-semibold text-slate-800 text-xs">
                    5. Address
                  </p>
                  <div className="space-y-1.5">
                    <input
                      className="premium-input w-full"
                      placeholder="House / Flat / Building / Street*"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                    />
                    <input
                      className="premium-input w-full"
                      placeholder="Landmark (optional)"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        className="premium-input"
                        placeholder="City / Locality*"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      <input
                        className="premium-input"
                        placeholder="Pincode*"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>
                    <textarea
                      className="premium-input w-full h-18 resize-none"
                      placeholder="Anything else we should know? (pet, parking, gate pass, etc.)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* 6. Payment preference */}
                <div className="space-y-1.5 pt-1">
                  <p className="font-semibold text-slate-800 text-xs">
                    6. Payment preference
                  </p>
                  <p className="text-[11px] text-slate-500">
                    You can still change this on the confirmation/payment
                    screen.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentPreference("cash_later")}
                      className={`rounded-2xl border px-3 py-2 text-left text-[11px] transition-all ${
                        paymentPreference === "cash_later"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_8px_22px_rgba(16,185,129,0.5)]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                      }`}
                    >
                      <p className="font-semibold text-[12px]">
                        Pay after service
                      </p>
                      <p className="mt-0.5">
                        Cash, UPI or card directly to technician after work is
                        completed.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentPreference("online_now")}
                      className={`rounded-2xl border px-3 py-2 text-left text-[11px] transition-all ${
                        paymentPreference === "online_now"
                          ? "border-blue-600 bg-blue-50 text-blue-800 shadow-[0_8px_22px_rgba(37,99,235,0.55)]"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                      }`}
                    >
                      <p className="font-semibold text-[12px]">
                        Pay online now
                      </p>
                      <p className="mt-0.5">
                        Reserve your slot with secure online payment (UPI /
                        card). Invoice will be shared digitally.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Errors & success (fallback) */}
                {submitError && (
                  <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 animate-shake">
                    {submitError}
                  </div>
                )}

                {successId && (
                  <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 animate-fadeGlow">
                    ✅ Your booking has been placed successfully. Redirecting to
                    confirmation...
                    <br />
                    <span className="text-[10px] text-emerald-600">
                      Booking reference: {successId}
                    </span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || loadingMeta || services.length === 0}
                  className="w-full py-2.5 rounded-2xl text-white text-sm font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 shadow-[0_15px_40px_rgba(37,99,235,0.65)] disabled:opacity-60 disabled:cursor-not-allowed mt-1 active:scale-[0.97] transition-all duration-150 animate-buttonPulse"
                >
                  {submitting ? "Placing your booking..." : "Confirm booking"}
                </button>

                <p className="text-[10px] text-slate-500">
                  By continuing, you agree to be contacted by AiroFix team via
                  call / WhatsApp for this service booking.
                </p>
              </form>
            </div>
          </section>

          {/* RIGHT – SUMMARY / INFO */}
          <aside className="space-y-4 animate-slideInRight">
            {/* Booking summary */}
            <div className="relative rounded-3xl bg-white/90 border border-slate-200 shadow-[0_18px_55px_rgba(15,23,42,0.16)] overflow-hidden">
              <div className="pointer-events-none absolute -top-20 right-[-40px] h-44 w-44 bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-400/30 blur-3xl" />
              <div className="relative p-4 sm:p-5 text-xs space-y-2">
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  <span>Booking summary</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-100">
                    Live sync
                  </span>
                </p>

                <div className="border border-slate-100 rounded-2xl px-3 py-2 bg-slate-50/90">
                  <p className="text-[11px] text-slate-500">
                    Selected service
                  </p>
                  <p className="text-[13px] font-semibold text-slate-900 mt-0.5">
                    {selectedService
                      ? selectedService.name
                      : "Choose a service"}
                  </p>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    {selectedSubService
                      ? selectedSubService.name
                      : "Then select exact work type (service, cleaning, install, repair)"}
                  </p>
                  {selectedSubService && (
                    <p className="text-[11px] text-blue-700 mt-1 font-semibold">
                      {selectedSubService.priceFrom ||
                      selectedSubService.priceTo
                        ? `Est. ₹${
                            selectedSubService.priceFrom || ""
                          }${
                            selectedSubService.priceTo
                              ? ` – ₹${selectedSubService.priceTo}`
                              : ""
                          }`
                        : "Final estimate will be shared after visit."}
                      {selectedSubService.approxDuration &&
                        ` • ${selectedSubService.approxDuration}`}
                    </p>
                  )}
                </div>

                <div className="border border-slate-100 rounded-2xl px-3 py-2 bg-slate-50/90 space-y-1">
                  <p className="text-[11px] text-slate-500">Appointment</p>
                  <p className="text-[11px] text-slate-900">
                    {date || "Pick a date"}{" "}
                    {slot && (
                      <>
                        • <span className="font-semibold">{slot}</span>
                      </>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    We operate between 10 AM – 6 PM. Exact arrival time may
                    vary by 15–30 mins depending on traffic.
                  </p>
                </div>

                {/* Payment summary */}
                <div className="border border-slate-100 rounded-2xl px-3 py-2 bg-slate-50/90 space-y-1">
                  <p className="text-[11px] text-slate-500">
                    Payment preference
                  </p>
                  <p className="text-[11px] text-slate-900">
                    {paymentPreference === "cash_later"
                      ? "Pay after service (Cash / UPI on visit)"
                      : "Pay online now (UPI / Card)"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    You can confirm or change this on the next screen before
                    making any payment.
                  </p>
                </div>

                <div className="border border-slate-100 rounded-2xl px-3 py-2 bg-slate-50/90 space-y-1">
                  <p className="text-[11px] text-slate-500">Why AiroFix?</p>
                  <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                    <li>Verified AC & electrician partners</li>
                    <li>Standard transparent pricing</li>
                    <li>Service warranty on most jobs</li>
                    <li>Digital invoice & payment options</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Urgent help CTA */}
            <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white p-4 sm:p-5 text-xs space-y-2 shadow-[0_18px_55px_rgba(37,99,235,0.7)] overflow-hidden animate-cardFloat">
              <div className="pointer-events-none absolute -top-10 right-[-20px] h-36 w-36 bg-white/15 blur-3xl" />
              <div className="relative">
                <p className="text-sm font-semibold">
                  Need same-day urgent help?
                </p>
                <p className="text-[11px] text-blue-100 mt-0.5">
                  For breakdowns & emergencies, book here and also share photos
                  & details with us on WhatsApp. We&apos;ll prioritise your slot
                  wherever possible.
                </p>
                <a
                  href="https://wa.me/917289026947"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1 rounded-2xl bg-white text-blue-700 px-3 py-1.5 text-[11px] font-semibold shadow-md mt-2 active:scale-[0.97] transition-all"
                >
                  💬 Chat on WhatsApp
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* INLINE STYLES FOR ANIMATIONS + PREMIUM INPUT */}
      <style>{`
        @keyframes bgFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-bgFlow {
          animation: bgFlow 18s ease-in-out infinite;
        }

        @keyframes orbFloat {
          0% { transform: translateY(0px); opacity: 0.7; }
          50% { transform: translateY(18px); opacity: 1; }
          100% { transform: translateY(0px); opacity: 0.7; }
        }
        .animate-orbFloat {
          animation: orbFloat 12s ease-in-out infinite;
        }

        @keyframes orbFloat2 {
          0% { transform: translateY(0px); opacity: 0.6; }
          50% { transform: translateY(-20px); opacity: 1; }
          100% { transform: translateY(0px); opacity: 0.6; }
        }
        .animate-orbFloat2 {
          animation: orbFloat2 16s ease-in-out infinite;
        }

        @keyframes logoPop {
          0% { transform: scale(0.9); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-logoPop {
          animation: logoPop 0.6s ease-out forwards;
        }

        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp {
          animation: fadeUp 0.7s ease-out forwards;
        }

        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-20px) translateY(10px); }
          100% { opacity: 1; transform: translateX(0) translateY(0); }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.7s ease-out forwards;
        }

        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(20px) translateY(10px); }
          100% { opacity: 1; transform: translateX(0) translateY(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.7s ease-out forwards;
        }

        @keyframes cardFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        .animate-cardFloat {
          animation: cardFloat 6s ease-in-out infinite;
        }

        @keyframes buttonPulse {
          0% { box-shadow: 0 15px 40px rgba(37,99,235,0.55); }
          50% { box-shadow: 0 18px 55px rgba(37,99,235,0.8); }
          100% { box-shadow: 0 15px 40px rgba(37,99,235,0.55); }
        }
        .animate-buttonPulse {
          animation: buttonPulse 2.6s ease-in-out infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        @keyframes fadeGlow {
          0% { opacity: 0; box-shadow: 0 0 0 rgba(16,185,129,0); }
          40% { opacity: 1; box-shadow: 0 0 30px rgba(16,185,129,0.5); }
          100% { opacity: 1; box-shadow: 0 0 0 rgba(16,185,129,0); }
        }
        .animate-fadeGlow {
          animation: fadeGlow 1.2s ease-out;
        }

        .premium-input {
          padding: 0.55rem 0.85rem;
          border-radius: 0.9rem;
          border: 1px solid rgba(148, 163, 184, 0.8);
          background: rgba(255,255,255,0.95);
          font-size: 0.78rem;
          color: #0f172a;
          outline: none;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, transform 0.12s ease;
        }
        .premium-input::placeholder {
          color: #94a3b8;
        }
        .premium-input:focus {
          border-color: #2563eb;
          background: #f8fafc;
          box-shadow: 0 0 0 1px rgba(37,99,235,0.5), 0 10px 25px rgba(15,23,42,0.16);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
