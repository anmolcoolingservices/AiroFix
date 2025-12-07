// components/tabs/BookTab.tsx
export function BookTab() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Book a Service</h2>
      <p className="text-xs text-slate-400">
        Select service type and preferred slot.
      </p>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block mb-1 text-slate-300">Service type</label>
          <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs">
            <option>AC Servicing</option>
            <option>AC Repair</option>
            <option>AC Installation</option>
            <option>AC Uninstallation</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-slate-300">Date</label>
          <input
            type="date"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs"
          />
        </div>

        <div>
          <label className="block mb-1 text-slate-300">Time slot</label>
          <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs">
            <option>10 AM – 12 PM</option>
            <option>12 PM – 2 PM</option>
            <option>2 PM – 4 PM</option>
            <option>4 PM – 6 PM</option>
          </select>
        </div>

        <button className="w-full mt-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-sm py-2 rounded-xl">
          Continue to Book
        </button>
      </div>
    </div>
  );
}
