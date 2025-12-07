// app/edit-booking/page.tsx
import { Suspense } from "react";
import EditBookingClient from "./EditBookingClient";

export const dynamic = "force-dynamic";

export default function EditBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
          Loading booking for edit…
        </div>
      }
    >
      <EditBookingClient />
    </Suspense>
  );
}
