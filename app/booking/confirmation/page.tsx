// app/booking/confirmation/page.tsx
import { Suspense } from "react";
import BookingConfirmationClient from "./BookingConfirmationClient";

export const dynamic = "force-dynamic";

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
          Loading your booking details…
        </div>
      }
    >
      <BookingConfirmationClient />
    </Suspense>
  );
}
