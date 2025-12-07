"use client";

import { useEffect, useMemo, useState } from "react";

const ADMIN_PASSWORD = "AiroFix@2025"; // change if needed

type Booking = {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  serviceType?: string;
  categoryName?: string;
  itemName?: string;
  approxPrice?: string;
  date?: string; // ideally YYYY-MM-DD
  slot?: string;
  city?: string;
  pincode?: string;
  status?: string;
  source?: string;
  createdAt?: number;
  updatedAt?: number;
  // NEW: engineer assignment (phone - last 10 digits)
  assignedEngineer?: string;
};

type Service = {
  firebaseKey?: string; // Firebase push key (for updates/deletes)
  id: string; // Stable ID (e.g. "svc_ac")
  name: string;
  type: "ac" | "electrician" | "other";
  basePrice?: string; // local use (mapped from displayPrice)
  iconUrl?: string;
  isActive?: boolean;
};

type SubService = {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  priceFrom?: string;
  priceTo?: string;
  approxDuration?: string;
  isActive?: boolean;
};

type Engineer = {
  id: string;
  name: string;
  phone: string;
  location?: string;
  serviceType: "ac" | "electrician" | "both";
  notes?: string;
  isActive?: boolean;
};

type Coupon = {
  id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  maxDiscount: number;
  minOrderAmount: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
};

type TabKey =
  | "bookings"
  | "services"
  | "subservices"
  | "engineers"
  | "coupons";

// helper: phone normalisation (last 10 digits)
function normalizePhone(p?: string | null): string {
  if (!p) return "";
  return p.replace(/\D/g, "").slice(-10);
}

export default function AdminPage() {
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<TabKey>("bookings");

  // BOOKINGS
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [fetchErrorBookings, setFetchErrorBookings] = useState("");

  // SERVICES
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    type: "ac",
    basePrice: "",
    iconUrl: "",
    isActive: true,
  });

  // SUB-SERVICES
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [loadingSubServices, setLoadingSubServices] = useState(false);
  const [subServicesError, setSubServicesError] = useState("");
  const [editingSubService, setEditingSubService] =
    useState<SubService | null>(null);
  const [subServiceForm, setSubServiceForm] = useState({
    serviceId: "",
    name: "",
    description: "",
    priceFrom: "",
    priceTo: "",
    approxDuration: "",
    isActive: true,
  });

  // ENGINEERS
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loadingEngineers, setLoadingEngineers] = useState(false);
  const [engineersError, setEngineersError] = useState("");
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [engineerForm, setEngineerForm] = useState({
    name: "",
    phone: "",
    location: "",
    serviceType: "ac",
    notes: "",
    isActive: true,
  });

  // COUPONS
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponsError, setCouponsError] = useState("");
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 10,
    maxDiscount: 0,
    minOrderAmount: 0,
    validFrom: "",
    validTo: "",
    isActive: true,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setAuthed(true);
      setError("");
    } else {
      setError("Galat password. Dubara try karo.");
    }
  };

  // -------- LOAD FUNCTIONS (reusable reload ke liye) --------

  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      setFetchErrorBookings("");
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load bookings.");
      }
      setBookings(data.bookings || []);
    } catch (err: any) {
      setFetchErrorBookings(
        err?.message || "Error while fetching bookings from server."
      );
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      setServicesError("");
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      // Map displayPrice -> basePrice for UI
      const mapped: Service[] = (data.services || []).map((s: any) => ({
        firebaseKey: s.firebaseKey,
        id: s.id,
        name: s.name,
        type: s.type,
        basePrice: s.basePrice ?? s.displayPrice ?? "",
        iconUrl: s.iconUrl,
        isActive: s.isActive ?? s.enabled ?? true,
      }));

      setServices(mapped);
    } catch (err: any) {
      setServicesError(
        err?.message || "Error while fetching services from server."
      );
    } finally {
      setLoadingServices(false);
    }
  };

  const loadSubServices = async () => {
    try {
      setLoadingSubServices(true);
      setSubServicesError("");
      const res = await fetch("/api/admin/sub-services");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setSubServices(data.subServices || []);
    } catch (err: any) {
      setSubServicesError(
        err?.message || "Error while fetching sub-services from server."
      );
    } finally {
      setLoadingSubServices(false);
    }
  };

  const loadEngineers = async () => {
    try {
      setLoadingEngineers(true);
      setEngineersError("");
      const res = await fetch("/api/admin/engineers");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setEngineers(data.engineers || []);
    } catch (err: any) {
      setEngineersError(
        err?.message || "Error while fetching engineers from server."
      );
    } finally {
      setLoadingEngineers(false);
    }
  };

  const loadCoupons = async () => {
    try {
      setLoadingCoupons(true);
      setCouponsError("");
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setCoupons(data.coupons || []);
    } catch (err: any) {
      setCouponsError(
        err?.message || "Error while fetching coupons from server."
      );
    } finally {
      setLoadingCoupons(false);
    }
  };

  // LOAD DATA AFTER LOGIN
  useEffect(() => {
    if (!authed) return;
    loadBookings();
    loadServices();
    loadSubServices();
    loadEngineers();
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // BOOKING STATS
  const webBookingsCount = useMemo(
    () => bookings.filter((b) => b.source === "web").length,
    [bookings]
  );

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-md p-6 space-y-4">
          <h1 className="text-lg font-semibold text-slate-900">
            AiroFix Admin Login
          </h1>
          <p className="text-xs text-slate-600">
            Temporary password-based login. Baad me Firebase Auth se replace
            kar sakte hain.
          </p>
          <form onSubmit={handleLogin} className="space-y-3 text-sm">
            <input
              type="password"
              placeholder="Admin password"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {error && <p className="text-[11px] text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold text-white text-sm shadow-md"
              style={{
                background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
              }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ------- ADMIN UI -------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            AiroFix Admin Panel
          </p>
          <p className="text-xs text-slate-500">
            Website + App bookings • Services • Engineers • Coupons
          </p>
        </div>
        <button
          onClick={() => {
            setAuthed(false);
            setInput("");
          }}
          className="text-xs text-slate-600 underline"
        >
          Logout
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-4">
        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            label="Total bookings (last 200)"
            value={bookings.length.toString()}
            note="Web + app"
          />
          <SummaryCard
            label="Website bookings"
            value={webBookingsCount.toString()}
            note="source = web"
          />
          <SummaryCard
            label="Active services"
            value={services
              .filter((s) => s.isActive !== false)
              .length.toString()}
            note="AC / Electrician etc."
          />
          <SummaryCard
            label="Active coupons"
            value={coupons
              .filter((c) => c.isActive !== false)
              .length.toString()}
            note="Promo codes"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 flex gap-2 text-xs">
          <TabButton
            label="Bookings"
            active={activeTab === "bookings"}
            onClick={() => setActiveTab("bookings")}
          />
          <TabButton
            label="Services"
            active={activeTab === "services"}
            onClick={() => setActiveTab("services")}
          />
          <TabButton
            label="Sub-services"
            active={activeTab === "subservices"}
            onClick={() => setActiveTab("subservices")}
          />
          <TabButton
            label="Engineers"
            active={activeTab === "engineers"}
            onClick={() => setActiveTab("engineers")}
          />
          <TabButton
            label="Coupons"
            active={activeTab === "coupons"}
            onClick={() => setActiveTab("coupons")}
          />
        </div>

        {/* TAB CONTENT */}
        {activeTab === "bookings" && (
          <BookingsTab
            bookings={bookings}
            loading={loadingBookings}
            error={fetchErrorBookings}
            reload={loadBookings}
            engineers={engineers}
          />
        )}

        {activeTab === "services" && (
          <ServicesTab
            services={services}
            loading={loadingServices}
            error={servicesError}
            form={serviceForm}
            setForm={setServiceForm}
            editing={editingService}
            setEditing={setEditingService}
            reload={loadServices}
          />
        )}

        {activeTab === "subservices" && (
          <SubServicesTab
            services={services}
            subServices={subServices}
            loading={loadingSubServices}
            error={subServicesError}
            form={subServiceForm}
            setForm={setSubServiceForm}
            editing={editingSubService}
            setEditing={setEditingSubService}
            reload={loadSubServices}
          />
        )}

        {activeTab === "engineers" && (
          <EngineersTab
            engineers={engineers}
            loading={loadingEngineers}
            error={engineersError}
            form={engineerForm}
            setForm={setEngineerForm}
            editing={editingEngineer}
            setEditing={setEditingEngineer}
            reload={loadEngineers}
          />
        )}

        {activeTab === "coupons" && (
          <CouponsTab
            coupons={coupons}
            loading={loadingCoupons}
            error={couponsError}
            form={couponForm}
            setForm={setCouponForm}
            editing={editingCoupon}
            setEditing={setEditingCoupon}
            reload={loadCoupons}
          />
        )}
      </main>
    </div>
  );
}

/* ------------ Small Components ------------ */

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 border-b-2 -mb-px ${
        active
          ? "border-blue-600 text-blue-700 font-semibold"
          : "border-transparent text-slate-600 hover:text-slate-900"
      } text-xs`}
    >
      {label}
    </button>
  );
}

/* ------------ Bookings Tab (with filters + bulk edit + engineer assign) ------------ */

function BookingsTab({
  bookings,
  loading,
  error,
  reload,
  engineers,
}: {
  bookings: Booking[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  engineers: Engineer[];
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [filterService, setFilterService] = useState<"all" | string>("all");
  const [filterSource, setFilterSource] = useState<"all" | string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");

  const [savingEngineerId, setSavingEngineerId] = useState<string | null>(null);

  // ---------- FILTERED LIST ----------
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterStatus !== "all") {
        const st = (b.status || "pending").toLowerCase();
        if (st !== filterStatus.toLowerCase()) return false;
      }
      if (filterService !== "all") {
        const stype = (b.serviceType || "").toLowerCase();
        if (stype !== filterService.toLowerCase()) return false;
      }
      if (filterSource !== "all") {
        const src = (b.source || "").toLowerCase();
        if (src !== filterSource.toLowerCase()) return false;
      }
      if (dateFrom && b.date && b.date < dateFrom) return false;
      if (dateTo && b.date && b.date > dateTo) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const blob = [
          b.customerName,
          b.phone,
          b.city,
          b.itemName,
          b.categoryName,
          b.pincode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }

      return true;
    });
  }, [bookings, filterStatus, filterService, filterSource, dateFrom, dateTo, search]);

  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((b) => selectedIds.includes(b.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filtered.some((b) => b.id === id))
      );
    } else {
      const idsToAdd = filtered
        .map((b) => b.id)
        .filter((id) => !selectedIds.includes(id));
      setSelectedIds((prev) => [...prev, ...idsToAdd]);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ---------- BULK STATUS ----------
  const handleBulkStatusUpdate = async () => {
    if (!selectedIds.length) {
      alert("Pehle kuch bookings select karo.");
      return;
    }
    if (!bulkStatus) {
      alert("Bulk ke liye koi status select karo.");
      return;
    }
    const ok = confirm(
      `Status '${bulkStatus}' ${selectedIds.length} bookings par apply karna hai?`
    );
    if (!ok) return;

    await fetch("/api/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status: bulkStatus }),
    });

    setSelectedIds([]);
    await reload();
  };

  // ---------- SINGLE BOOKING: ASSIGN ENGINEER ----------
  async function handleAssignEngineer(bookingId: string, engineerPhone: string) {
    setSavingEngineerId(bookingId);
    try {
      await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          assignedEngineer: engineerPhone || null,
        }),
      });
      await reload();
    } finally {
      setSavingEngineerId(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-semibold text-slate-700">
            Latest bookings (max 200)
          </p>
          {loading && (
            <p className="text-[11px] text-slate-500">Loading...</p>
          )}
          {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => reload()}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 bg-slate-50 hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-5 gap-2 text-[11px] mb-2">
        <input
          placeholder="Search (name, phone, city, service)"
          className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-[11px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Status: All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white"
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
        >
          <option value="all">Service: All</option>
          <option value="ac">AC</option>
          <option value="electrician">Electrician</option>
        </select>
        <select
          className="border border-slate-200 rounded-xl px-3 py-1.5 bg-white"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
        >
          <option value="all">Source: All</option>
          <option value="web">Web</option>
          <option value="app">App</option>
        </select>
        <div className="flex gap-1">
          <input
            type="date"
            className="flex-1 border border-slate-200 rounded-xl px-2 py-1.5 bg-white"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="flex-1 border border-slate-200 rounded-xl px-2 py-1.5 bg-white"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div className="text-[11px] text-slate-600">
          Total: {bookings.length} • Showing: {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">
            Selected: {selectedIds.length}
          </span>
          <select
            className="border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-[11px]"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Bulk status...</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={handleBulkStatusUpdate}
            className="px-3 py-1.5 rounded-xl text-[11px] text-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            Apply to selected
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500">
          No bookings found for current filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                  />
                </th>
                <th className="border px-2 py-1 text-left">Customer</th>
                <th className="border px-2 py-1 text-left">Service</th>
                <th className="border px-2 py-1 text-left">Date & Slot</th>
                <th className="border px-2 py-1 text-left">Location</th>
                <th className="border px-2 py-1 text-left">Source</th>
                <th className="border px-2 py-1 text-left">Engineer</th>
                <th className="border px-2 py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const st = (b.status || "pending").toLowerCase();
                let statusClass =
                  "bg-slate-100 text-slate-700 border-slate-200";
                if (st === "completed")
                  statusClass =
                    "bg-emerald-50 text-emerald-700 border-emerald-200";
                else if (st === "ongoing" || st === "confirmed")
                  statusClass =
                    "bg-blue-50 text-blue-700 border-blue-200";
                else if (st === "cancelled")
                  statusClass =
                    "bg-red-50 text-red-600 border-red-200";

                const currentAssigned = b.assignedEngineer || "";

                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="border px-2 py-1 text-center align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => toggleRow(b.id)}
                      />
                    </td>
                    <td className="border px-2 py-1 align-top">
                      <div className="font-semibold">{b.customerName}</div>
                      <div className="text-[11px] text-slate-600">
                        📱 {b.phone}
                      </div>
                      {b.email && (
                        <div className="text-[11px] text-slate-500">
                          ✉️ {b.email}
                        </div>
                      )}
                    </td>
                    <td className="border px-2 py-1 align-top">
                      <div className="font-semibold text-[11px]">
                        {b.serviceType === "ac"
                          ? "AC"
                          : b.serviceType === "electrician"
                          ? "Electrician"
                          : b.serviceType || "-"}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {b.categoryName}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {b.itemName}
                      </div>
                      <div className="text-[11px] text-blue-700 font-semibold">
                        {b.approxPrice}
                      </div>
                    </td>
                    <td className="border px-2 py-1 align-top">
                      <div className="text-[11px] text-slate-700">
                        {b.date || "-"}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {b.slot || "-"}
                      </div>
                      {b.createdAt && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Created:{" "}
                          {new Date(b.createdAt).toLocaleString("en-IN")}
                        </div>
                      )}
                    </td>
                    <td className="border px-2 py-1 align-top">
                      <div className="text-[11px] text-slate-700">
                        {b.city} {b.pincode && `- ${b.pincode}`}
                      </div>
                    </td>
                    <td className="border px-2 py-1 align-top">
                      <span className="text-[11px] text-slate-600">
                        {b.source || "-"}
                      </span>
                    </td>
                    {/* ENGINEER DROPDOWN */}
                    <td className="border px-2 py-1 align-top">
                      <select
                        className="border border-slate-200 rounded-lg px-2 py-1 text-[11px] bg-white w-full"
                        value={currentAssigned}
                        onChange={(e) =>
                          handleAssignEngineer(b.id, e.target.value)
                        }
                        disabled={savingEngineerId === b.id}
                      >
                        <option value="">Unassigned</option>
                        {engineers
                          .filter((eng) => eng.isActive !== false)
                          .map((eng) => (
                            <option key={eng.id} value={eng.phone}>
                              {eng.name} ({eng.phone})
                            </option>
                          ))}
                      </select>
                      {savingEngineerId === b.id && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Saving...
                        </p>
                      )}
                    </td>
                    {/* STATUS PILL */}
                    <td className="border px-2 py-1 align-top">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${statusClass}`}
                      >
                        {b.status || "pending"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------ Services Tab ------------ */
// (BAKI TABS KA CODE YAHI SE SAME RAHEGA – maine unme kuch change nahi kiya hai,
// sirf upar wale BookingsTab me engineer assignment add kiya hai.)

// 👇 Yahan se aapka existing ServicesTab / SubServicesTab / EngineersTab / CouponsTab
// WOHI REHNE DENA – jo aapne bheja tha – unme koi logic change nahi.

/* ------------ Services Tab ------------ */

function ServicesTab(props: {
  services: Service[];
  loading: boolean;
  error: string;
  form: {
    name: string;
    type: string;
    basePrice: string;
    iconUrl: string;
    isActive: boolean;
  };
  setForm: (v: any) => void;
  editing: Service | null;
  setEditing: (v: Service | null) => void;
  reload: () => Promise<void>;
}) {
  const { services, loading, error, form, setForm, editing, setEditing, reload } =
    props;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    // Map basePrice -> displayPrice for API
    const commonPayload = {
      name: form.name,
      type: form.type,
      displayPrice: form.basePrice,
      iconUrl: form.iconUrl,
      isActive: form.isActive,
      enabled: form.isActive, // optional: keep both for compatibility
    };

    if (editing) {
      const firebaseKey = editing.firebaseKey;
      if (!firebaseKey) {
        alert(
          "firebaseKey missing for this service. Isko delete karke dobara create karna padega."
        );
        return;
      }

      await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseKey,
          ...commonPayload,
        }),
      });
    } else {
      await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commonPayload),
      });
    }

    setForm({
      name: "",
      type: "ac",
      basePrice: "",
      iconUrl: "",
      isActive: true,
    });
    setEditing(null);
    await reload();
  }

  async function handleDelete(s: Service) {
    if (!confirm("Delete this service?")) return;
    if (!s.firebaseKey) {
      alert("firebaseKey missing, delete nahi ho payega. Seed data check karo.");
      return;
    }
    await fetch("/api/admin/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firebaseKey: s.firebaseKey }),
    });
    await reload();
  }

  return (
    <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs space-y-3">
        <p className="text-xs font-semibold text-slate-700 mb-1">
          {editing ? "Edit service" : "Add new service"}
        </p>
        {error && <p className="text-[11px] text-red-500 mb-1">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            placeholder="Service name (e.g. AC Services)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="flex gap-2">
            <select
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="ac">AC</option>
              <option value="electrician">Electrician</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="Base price (optional)"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.basePrice}
              onChange={(e) =>
                setForm({ ...form, basePrice: e.target.value })
              }
            />
          </div>
          <input
            placeholder="Icon URL (optional, future use)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
            value={form.iconUrl}
            onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
          />
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
          <button
            type="submit"
            className="w-full py-2 rounded-xl text-white font-semibold text-xs shadow-md"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            {editing ? "Update service" : "Add service"}
          </button>
          {editing && (
            <button
              type="button"
              className="w-full py-2 rounded-xl text-xs border border-slate-200 text-slate-600 mt-1"
              onClick={() => {
                setEditing(null);
                setForm({
                  name: "",
                  type: "ac",
                  basePrice: "",
                  iconUrl: "",
                  isActive: true,
                });
              }}
            >
              Cancel edit
            </button>
          )}
        </form>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-700">
            All services
          </p>
          {loading && (
            <p className="text-[11px] text-slate-500">Loading...</p>
          )}
        </div>
        {services.length === 0 ? (
          <p className="text-xs text-slate-500">
            Abhi koi service nahi hai. Left side se add kijiye.
          </p>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-2 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {s.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Type: {s.type} •{" "}
                    {s.basePrice
                      ? s.basePrice
                      : "No base price"}
                  </p>
                  {s.iconUrl && (
                    <p className="text-[10px] text-slate-400 break-all">
                      Icon: {s.iconUrl}
                    </p>
                  )}
                  <p className="text-[10px] mt-1">
                    Status:{" "}
                    <span
                      className={
                        s.isActive !== false
                          ? "text-emerald-600"
                          : "text-red-500"
                      }
                    >
                      {s.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    className="text-[11px] text-blue-600 underline"
                    onClick={() => {
                      setEditing(s);
                      setForm({
                        name: s.name,
                        type: s.type,
                        basePrice: s.basePrice || "",
                        iconUrl: s.iconUrl || "",
                        isActive: s.isActive !== false,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-[11px] text-red-500 underline"
                    onClick={() => handleDelete(s)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------ Sub-Services Tab ------------ */

function SubServicesTab(props: {
  services: Service[];
  subServices: SubService[];
  loading: boolean;
  error: string;
  form: any;
  setForm: (v: any) => void;
  editing: SubService | null;
  setEditing: (v: SubService | null) => void;
  reload: () => Promise<void>;
}) {
  const {
    services,
    subServices,
    loading,
    error,
    form,
    setForm,
    editing,
    setEditing,
    reload,
  } = props;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.serviceId) return;

    if (editing) {
      await fetch("/api/admin/sub-services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/admin/sub-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({
      serviceId: "",
      name: "",
      description: "",
      priceFrom: "",
      priceTo: "",
      approxDuration: "",
      isActive: true,
    });
    setEditing(null);
    await reload();
  }

  async function handleDelete(ss: SubService) {
    if (!confirm("Delete this sub-service?")) return;
    await fetch("/api/admin/sub-services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: ss.id,
        serviceId: ss.serviceId,
      }),
    });
    await reload();
  }

  return (
    <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr] text-xs">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700 mb-1">
          {editing ? "Edit sub-service" : "Add new sub-service"}
        </p>
        {error && <p className="text-[11px] text-red-500 mb-1">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-2">
          <select
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
          >
            <option value="">Select main service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Sub-service name (e.g. Deep AC Service)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs h-16"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
          <div className="flex gap-2">
            <input
              placeholder="Price from (₹)"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.priceFrom}
              onChange={(e) =>
                setForm({ ...form, priceFrom: e.target.value })
              }
            />
            <input
              placeholder="Price to (₹)"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.priceTo}
              onChange={(e) =>
                setForm({ ...form, priceTo: e.target.value })
              }
            />
          </div>
          <input
            placeholder="Approx. duration (e.g. 45–60 mins)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
            value={form.approxDuration}
            onChange={(e) =>
              setForm({ ...form, approxDuration: e.target.value })
            }
          />
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
          <button
            type="submit"
            className="w-full py-2 rounded-xl text-white font-semibold text-xs shadow-md"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            {editing ? "Update sub-service" : "Add sub-service"}
          </button>
          {editing && (
            <button
              type="button"
              className="w-full py-2 rounded-xl text-xs border border-slate-200 text-slate-600 mt-1"
              onClick={() => {
                setEditing(null);
                setForm({
                  serviceId: "",
                  name: "",
                  description: "",
                  priceFrom: "",
                  priceTo: "",
                  approxDuration: "",
                  isActive: true,
                });
              }}
            >
              Cancel edit
            </button>
          )}
        </form>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-700">
            All sub-services
          </p>
          {loading && (
            <p className="text-[11px] text-slate-500">Loading...</p>
          )}
        </div>
        {subServices.length === 0 ? (
          <p className="text-xs text-slate-500">
            Abhi koi sub-service nahi hai. Left se add karein.
          </p>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-auto pr-1 text-xs">
            {subServices.map((ss) => {
              const main = services.find((s) => s.id === ss.serviceId);
              return (
                <div
                  key={ss.id}
                  className="border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 flex justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {ss.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Under: {main ? main.name : ss.serviceId}
                    </p>
                    {ss.description && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        {ss.description}
                      </p>
                    )}
                    <p className="text-[11px] text-blue-700 font-semibold mt-1">
                      {ss.priceFrom || ss.priceTo
                        ? `₹${ss.priceFrom || ""}${
                            ss.priceTo ? ` – ₹${ss.priceTo}` : ""
                          }`
                        : "Price: as per visit"}
                      {ss.approxDuration && ` • ${ss.approxDuration}`}
                    </p>
                    <p className="text-[10px] mt-1">
                      Status:{" "}
                      <span
                        className={
                          ss.isActive !== false
                            ? "text-emerald-600"
                            : "text-red-500"
                        }
                      >
                        {ss.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      className="text-[11px] text-blue-600 underline"
                      onClick={() => {
                        setEditing(ss);
                        setForm({
                          serviceId: ss.serviceId,
                          name: ss.name,
                          description: ss.description || "",
                          priceFrom: ss.priceFrom || "",
                          priceTo: ss.priceTo || "",
                          approxDuration: ss.approxDuration || "",
                          isActive: ss.isActive !== false,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-[11px] text-red-500 underline"
                      onClick={() => handleDelete(ss)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------ Engineers Tab ------------ */

function EngineersTab(props: {
  engineers: Engineer[];
  loading: boolean;
  error: string;
  form: any;
  setForm: (v: any) => void;
  editing: Engineer | null;
  setEditing: (v: Engineer | null) => void;
  reload: () => Promise<void>;
}) {
  const {
    engineers,
    loading,
    error,
    form,
    setForm,
    editing,
    setEditing,
    reload,
  } = props;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    if (editing) {
      await fetch("/api/admin/engineers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/admin/engineers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({
      name: "",
      phone: "",
      location: "",
      serviceType: "ac",
      notes: "",
      isActive: true,
    });
    setEditing(null);
    await reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this engineer?")) return;
    await fetch("/api/admin/engineers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reload();
  }

  return (
    <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr] text-xs">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700 mb-1">
          {editing ? "Edit engineer" : "Add new engineer"}
        </p>
        {error && <p className="text-[11px] text-red-500 mb-1">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            placeholder="Name"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Phone"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              placeholder="Location / Area"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />
            <select
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.serviceType}
              onChange={(e) =>
                setForm({ ...form, serviceType: e.target.value })
              }
            >
              <option value="ac">AC</option>
              <option value="electrician">Electrician</option>
              <option value="both">Both</option>
            </select>
          </div>
          <textarea
            placeholder="Notes (experience, speciality etc.)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs h-16"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
          <button
            type="submit"
            className="w-full py-2 rounded-xl text-white font-semibold text-xs shadow-md"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            {editing ? "Update engineer" : "Add engineer"}
          </button>
          {editing && (
            <button
              type="button"
              className="w-full py-2 rounded-xl text-xs border border-slate-200 text-slate-600 mt-1"
              onClick={() => {
                setEditing(null);
                setForm({
                  name: "",
                  phone: "",
                  location: "",
                  serviceType: "ac",
                  notes: "",
                  isActive: true,
                });
              }}
            >
              Cancel edit
            </button>
          )}
        </form>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-700">
            All engineers
          </p>
          {loading && (
            <p className="text-[11px] text-slate-500">Loading...</p>
          )}
        </div>
        {engineers.length === 0 ? (
          <p className="text-xs text-slate-500">
            Abhi koi engineer add nahi hai.
          </p>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-auto pr-1 text-xs">
            {engineers.map((eng) => (
              <div
                key={eng.id}
                className="border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 flex justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {eng.name}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    📱 {eng.phone}
                  </p>
                  {eng.location && (
                    <p className="text-[11px] text-slate-500">
                      📍 {eng.location}
                    </p>
                  )}
                  <p className="text-[11px] text-blue-700 mt-1">
                    Service: {eng.serviceType}
                  </p>
                  {eng.notes && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      {eng.notes}
                    </p>
                  )}
                  <p className="text-[10px] mt-1">
                    Status:{" "}
                    <span
                      className={
                        eng.isActive !== false
                          ? "text-emerald-600"
                          : "text-red-500"
                      }
                    >
                      {eng.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    className="text-[11px] text-blue-600 underline"
                    onClick={() => {
                      setEditing(eng);
                      setForm({
                        name: eng.name,
                        phone: eng.phone,
                        location: eng.location || "",
                        serviceType: eng.serviceType,
                        notes: eng.notes || "",
                        isActive: eng.isActive !== false,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-[11px] text-red-500 underline"
                    onClick={() => handleDelete(eng.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------ Coupons Tab ------------ */

function CouponsTab(props: {
  coupons: Coupon[];
  loading: boolean;
  error: string;
  form: any;
  setForm: (v: any) => void;
  editing: Coupon | null;
  setEditing: (v: Coupon | null) => void;
  reload: () => Promise<void>;
}) {
  const {
    coupons,
    loading,
    error,
    form,
    setForm,
    editing,
    setEditing,
    reload,
  } = props;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) return;

    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      maxDiscount: Number(form.maxDiscount),
      minOrderAmount: Number(form.minOrderAmount),
    };

    if (editing) {
      await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
    } else {
      await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setForm({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      maxDiscount: 0,
      minOrderAmount: 0,
      validFrom: "",
      validTo: "",
      isActive: true,
    });
    setEditing(null);
    await reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reload();
  }

  return (
    <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr] text-xs">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700 mb-1">
          {editing ? "Edit coupon" : "Add new coupon"}
        </p>
        {error && <p className="text-[11px] text-red-500 mb-1">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            placeholder="Code (e.g. AIROFIX150)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs uppercase"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <textarea
            placeholder="Description (user visible)"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs h-16"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
          <div className="flex gap-2">
            <select
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.discountType}
              onChange={(e) =>
                setForm({ ...form, discountType: e.target.value })
              }
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
            <input
              type="number"
              placeholder={
                form.discountType === "percentage"
                  ? "Discount %"
                  : "Flat discount ₹"
              }
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.discountValue}
              onChange={(e) =>
                setForm({ ...form, discountValue: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Max discount (₹)"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.maxDiscount}
              onChange={(e) =>
                setForm({ ...form, maxDiscount: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Min order amount (₹)"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.minOrderAmount}
              onChange={(e) =>
                setForm({ ...form, minOrderAmount: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.validFrom}
              onChange={(e) =>
                setForm({ ...form, validFrom: e.target.value })
              }
            />
            <input
              type="date"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
              value={form.validTo}
              onChange={(e) =>
                setForm({ ...form, validTo: e.target.value })
              }
            />
          </div>
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
          <button
            type="submit"
            className="w-full py-2 rounded-xl text-white font-semibold text-xs shadow-md"
            style={{
              background: "linear-gradient(135deg, #0E63C8, #00B3FF)",
            }}
          >
            {editing ? "Update coupon" : "Add coupon"}
          </button>
          {editing && (
            <button
              type="button"
              className="w-full py-2 rounded-xl text-xs border border-slate-200 text-slate-600 mt-1"
              onClick={() => {
                setEditing(null);
                setForm({
                  code: "",
                  description: "",
                  discountType: "percentage",
                  discountValue: 10,
                  maxDiscount: 0,
                  minOrderAmount: 0,
                  validFrom: "",
                  validTo: "",
                  isActive: true,
                });
              }}
            >
              Cancel edit
            </button>
          )}
        </form>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-700">
            All coupons
          </p>
          {loading && (
            <p className="text-[11px] text-slate-500">Loading...</p>
          )}
        </div>
        {coupons.length === 0 ? (
          <p className="text-xs text-slate-500">
            Abhi koi coupon nahi hai.
          </p>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-auto pr-1 text-xs">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 flex justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {c.code}
                  </p>
                  {c.description && (
                    <p className="text-[11px] text-slate-600">
                      {c.description}
                    </p>
                  )}
                  <p className="text-[11px] text-blue-700 mt-1">
                    {c.discountType === "percentage"
                      ? `${c.discountValue}% off`
                      : `Flat ₹${c.discountValue} off`}
                    {c.maxDiscount > 0 &&
                      ` • Max ₹${c.maxDiscount} discount`}
                    {c.minOrderAmount > 0 &&
                      ` • Min order ₹${c.minOrderAmount}`}
                  </p>
                  {(c.validFrom || c.validTo) && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Valid: {c.validFrom || "—"} to {c.validTo || "—"}
                    </p>
                  )}
                  <p className="text-[10px] mt-1">
                    Status:{" "}
                    <span
                      className={
                        c.isActive !== false
                          ? "text-emerald-600"
                          : "text-red-500"
                      }
                    >
                      {c.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    className="text-[11px] text-blue-600 underline"
                    onClick={() => {
                      setEditing(c);
                      setForm({
                        code: c.code,
                        description: c.description || "",
                        discountType: c.discountType,
                        discountValue: c.discountValue,
                        maxDiscount: c.maxDiscount,
                        minOrderAmount: c.minOrderAmount,
                        validFrom: c.validFrom || "",
                        validTo: c.validTo || "",
                        isActive: c.isActive !== false,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-[11px] text-red-500 underline"
                    onClick={() => handleDelete(c.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
