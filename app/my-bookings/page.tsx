// app/my-bookings/page.tsx
"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  customerName?: string;
  phone?: string;
  serviceType?: string;
  categoryName?: string;
  itemName?: string;
  date?: string;
  slot?: string;
  approxPrice?: string;
  status?: string;
  paymentStatus?: string;
  paymentPreference?: string;
  createdAt?: number;
};

export default function MyBookingsPage() {
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [filter, setFilter] = useState<"all" | "upcoming" | "pending" | "completed" | "cancelled">("all");

  // Fetch bookings when phone is set
  useEffect(() => {
    if (!normalizedPhone) return;

    let cancelled = false;

    async function fetchBookings() {
      try {
        setLoading(true);
        setError("");
        setInfo("");

        const res = await fetch(`/api/bookings/by-phone?phone=${normalizedPhone}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Unable to fetch bookings.");
        }

        if (cancelled) return;

        const list: Booking[] = data.bookings || [];
        setBookings(list);

        if (list.length === 0) {
          setInfo("Is mobile number ke naam se koi booking nahi mili.");
        } else {
          setInfo(`Showing ${list.length} booking(s) for +91-${normalizedPhone}.`);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Error while loading bookings.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBookings();

    return () => {
      cancelled = true;
    };
  }, [normalizedPhone]);

  function normalizeAndSearch() {
    setError("");
    setInfo("");
    setBookings([]);

    const digits = phoneInput.replace(/\D/g, "");
    const last10 = digits.slice(-10);

    if (!last10 || last10.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setNormalizedPhone(last10);
  }

  function statusClasses(status?: string) {
    if (!status) return "bg-slate-100 text-slate-700";

    switch (status.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "confirmed":
      case "ongoing":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    const st = (b.status || "").toLowerCase();

    if (filter === "pending") return st === "pending";
    if (filter === "completed") return st === "completed";
    if (filter === "cancelled") return st === "cancelled";
    if (filter === "upcoming") {
      return st === "pending" || st === "confirmed" || st === "ongoing";
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            My bookings
          </p>
          <p className="text-[11px] text-slate-500">
            Apni purani aur upcoming AiroFix bookings yahan dekh sakte hain.
          </p>
        </div>
        <a
          href="/"
          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
        >
          Back to home
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Phone input block */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-3">
          <p className="text-[11px] font-semibold text-slate-800">
            Enter your mobile number
          </p>
          <p className="text-[11px] text-slate-600">
            Same number jisse aapne booking ki thi. OTP ki zarurat nahi – sirf number se history dikhegi.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px]">
              <span className="text-slate-500 mr-1.5">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="bg-transparent outline-none text-[11px] flex-1"
              />
            </div>

            <button
              type="button"
              onClick={normalizeAndSearch}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl text-[11px] font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
              }}
            >
              {loading ? "Fetching…" : "View bookings"}
            </button>
          </div>

          {normalizedPhone && !loading && (
            <p className="text-[11px] text-slate-500 mt-1">
              Showing bookings for: <span className="font-mono">+91-{normalizedPhone}</span>
            </p>
          )}

          {error && (
            <div className="mt-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          {info && !error && (
            <div className="mt-2 text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              {info}
            </div>
          )}
        </section>

        {/* Filters + list */}
        {normalizedPhone && (
          <section className="space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              {(["all", "upcoming", "pending", "completed", "cancelled"] as const).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold ${
                      filter === key
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {key.toUpperCase()}
                  </button>
                )
              )}
            </div>

            {/* Booking cards */}
            {loading ? (
              <p className="text-[11px] text-slate-500 mt-3">
                Loading bookings…
              </p>
            ) : filteredBookings.length === 0 ? (
              <p className="text-[11px] text-slate-500 mt-3">
                Selected filter ke under koi booking nahi mili.
              </p>
            ) : (
              <div className="space-y-3 mt-1">
                {filteredBookings.map((b) => {
                  const isPending =
                    (b.status || "").toLowerCase() === "pending";
                  const isPaymentPending =
                    (b.paymentStatus || "").toLowerCase() === "pending";

                  return (
                    <div
                      key={b.id}
                      className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            {b.categoryName || b.serviceType || "Service"}
                          </p>
                          <p className="text-xs font-semibold text-slate-900">
                            {b.itemName || "Exact job as discussed with technician"}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {b.date || "Date not set"}
                            {b.slot && <> • {b.slot}</>}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold ${statusClasses(
                            b.status
                          )}`}
                        >
                          {b.status || "—"}
                        </span>
                      </div>

                      {b.approxPrice && (
                        <p className="text-[11px] text-blue-700 font-semibold">
                          Est. {b.approxPrice}
                        </p>
                      )}

                      {/* Payment chip */}
                      {b.paymentPreference && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Payment mode:{" "}
                          <span className="font-semibold">
                            {b.paymentPreference.toUpperCase()}
                          </span>{" "}
                          • Status:{" "}
                          <span className="font-semibold">
                            {b.paymentStatus || "N/A"}
                          </span>
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* View / Pay */}
                        <a
                          href={`/booking/confirmation?id=${b.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-100"
                        >
                          {isPaymentPending
                            ? "View & pay"
                            : "View details"}
                        </a>

                        {/* Edit & Cancel – only for pending on UI level
                            (server-side rules already cancel/edit pages me lag rahe hain)
                        */}
                        {isPending && (
                          <>
                            <a
                              href={`/edit-booking?id=${b.id}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold border border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </a>
                            <a
                              href={`/cancel-booking?id=${b.id}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold border border-red-600 text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
