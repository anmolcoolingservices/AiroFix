// components/tabs/MyBookingsTab.tsx
export function MyBookingsTab() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">My Bookings</h2>
      <p className="text-xs text-slate-400">
        Login & Firebase connect hone ke baad yahan live bookings dikhenge.
      </p>

      <div className="mt-3 rounded-2xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-400">
        No bookings yet. <br />
        Tap on <span className="font-semibold">Book</span> to create your first
        booking.
      </div>
    </div>
  );
}
