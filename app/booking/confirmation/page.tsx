"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function AdminBookingConfirmationInner() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id") || "";
  const status = searchParams.get("status") || "";
  const source = searchParams.get("source") || "";

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3 text-sm">
        <h1 className="text-base font-semibold text-slate-900">
          Admin booking confirmation
        </h1>

        <p className="text-[12px] text-slate-600">
          Ye page sirf admin reference ke liye hai. Normally customers ko{" "}
          <code className="px-1 py-0.5 rounded bg-slate-100 text-[11px]">
            /booking/confirmation
          </code>{" "}
          par redirect kiya jata hai.
        </p>

        <div className="mt-2 space-y-1 text-[12px]">
          <p className="text-slate-500">Booking ID:</p>
          <p className="font-mono text-slate-900">
            {bookingId || "— (missing)"}
          </p>

          {status && (
            <>
              <p className="mt-2 text-slate-500">Payment / action status:</p>
              <p className="text-slate-900 font-semibold">{status}</p>
            </>
          )}

          {source && (
            <>
              <p className="mt-2 text-slate-500">Source:</p>
              <p className="text-slate-900">{source}</p>
            </>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <a
            href="/"
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            ⬅ Back to home
          </a>

          <a
            href="/admin"
            className="text-[11px] text-slate-600 hover:text-slate-900 underline"
          >
            Open Admin Panel
          </a>
        </div>
      </div>
    </main>
  );
}

export default function AdminBookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
          Loading admin booking confirmation…
        </div>
      }
    >
      <AdminBookingConfirmationInner />
    </Suspense>
  );
}
