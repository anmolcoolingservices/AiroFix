// components/tabs/ProfileTab.tsx
export function ProfileTab() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Profile</h2>
      <p className="text-xs text-slate-400">
        Yahan baad me login, phone OTP, addresses, etc. aayenge.
      </p>

      <div className="bg-slate-800/80 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-semibold">Guest User</p>
            <p className="text-[11px] text-slate-400">
              Login to manage your bookings & addresses.
            </p>
          </div>
        </div>

        <button className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl py-2 text-xs">
          Login with Mobile Number
        </button>
      </div>
    </div>
  );
}
