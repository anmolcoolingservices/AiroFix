// components/tabs/HomeTab.tsx
export function HomeTab() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-300">Welcome to</p>
        <h2 className="text-xl font-semibold tracking-tight">
          AiroFix AC Service
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Fast AC repair, installation & maintenance at your doorstep.
        </p>
      </div>

      <div className="bg-slate-800/80 rounded-2xl p-3">
        <p className="text-xs text-slate-300 mb-1">🔥 Ongoing Offer</p>
        <p className="text-sm font-medium">
          Get flat ₹150 OFF on first AC service
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Applicable on servicing & gas refilling bookings above ₹999.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Popular services</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <ServiceChip title="AC Servicing" subtitle="Starting ₹499" />
          <ServiceChip title="AC Repair" subtitle="No cooling / noise" />
          <ServiceChip title="AC Installation" subtitle="Split & Window" />
          <ServiceChip title="AC Uninstallation" subtitle="Shift / remove" />
        </div>
      </div>
    </div>
  );
}

function ServiceChip({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <button className="bg-slate-800/80 hover:bg-slate-700/80 rounded-xl p-3 text-left">
      <p className="text-[13px] font-medium">{title}</p>
      <p className="text-[11px] text-slate-400">{subtitle}</p>
    </button>
  );
}
