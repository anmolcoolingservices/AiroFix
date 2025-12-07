// app/cancel-booking/page.tsx
import { Suspense } from "react";
import CancelBookingClient from "./CancelBookingClient";

export const dynamic = "force-dynamic";

export default function CancelBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
          Loading cancellation details…
        </div>
      }
    >
      <CancelBookingClient />
    </Suspense>
  );
}
