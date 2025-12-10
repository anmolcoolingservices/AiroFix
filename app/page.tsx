// app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* ========== HERO (DARK, MOBILE-FRIENDLY) ========== */}
      <header className="relative bg-slate-950 text-white">
        {/* gradient background */}
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(circle at top left, #2563EB 0%, transparent 45%), radial-gradient(circle at top right, #38BDF8 0%, transparent 45%), linear-gradient(135deg, #020617 0%, #020617 50%, #020617 100%)",
          }}
        />
        {/* soft glows */}
        <div className="pointer-events-none absolute -top-20 left-10 h-40 w-40 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute top-32 -right-10 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 pt-4 pb-8">
          {/* Top NAV – only logo + WhatsApp/Call */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shadow-md">
                {/* Logo image */}
                <Image
                  src="/airofix-logo.png"
                  alt="AiroFix"
                  fill
                  className="object-contain p-1"
                />
                <span className="text-[13px] font-bold tracking-tight relative z-10">
                  AF
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">AiroFix</p>
                <p className="text-[11px] text-slate-300">
                  AC & Electrician Services • Delhi NCR
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              <a
                href="https://wa.me/918851543700"
                target="_blank"
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 transition flex items-center gap-1"
              >
                💬 <span>WhatsApp</span>
              </a>
              <a
                href="tel:+918851543700"
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 transition flex items-center gap-1"
              >
                📞 <span>Call</span>
              </a>
            </div>
          </div>

          {/* HERO CONTENT */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr,1.1fr] items-start">
            {/* Left text */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 border border-white/15 text-[11px] text-slate-200">
                <span className="text-xs">⚡</span>
                <span>App-level experience, seedha website se</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-[26px] sm:text-[32px] lg:text-[34px] font-semibold leading-snug tracking-tight">
                  Premium{" "}
                  <span className="text-cyan-300 font-bold">AC service</span> &{" "}
                  <span className="text-cyan-300 font-bold">electrician</span>{" "}
                  on your schedule.
                </h1>

                <p className="text-[13px] sm:text-sm text-slate-300 max-w-xl">
                  10 AM – 6 PM time-slot booking, verified technicians, rate
                  card inspired by Urban Company, but local Delhi NCR ke hisaab
                  se pricing. App install ki zarurat nahi – mobile browser se hi
                  poora flow complete.
                </p>
              </div>

              {/* CTA row + My Booking link */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/my-bookings"
                  className="inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-950 bg-white shadow-lg shadow-blue-500/30 active:scale-[0.97] transition"
                >
                  🚀 Book AC / Electrician
                </Link>
                <Link
                  href="#rate-card"
                  className="inline-flex items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-semibold border border-white/25 bg-white/5 hover:bg-white/10 transition"
                >
                  📋 Sample rate card
                </Link>
                {/* NEW: My booking / check status link */}
                <Link
                  href="/booking/track"
                  className="inline-flex items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-semibold border border-white/25 bg-white/0 hover:bg-white/10 transition"
                >
                  🔎 Check my booking
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-300 pt-1.5">
                <StatPill label="4.8/5 rating" />
                <StatPill label="1,200+ happy customers" />
                <StatPill label="3,500+ AC & electrician jobs" />
              </div>

              {/* 2-COLUMN HERO TILES (desktop only) */}
              <div className="hidden md:grid grid-cols-2 gap-3 pt-2">
                <HeroMiniCard
                  icon="❄️"
                  title="AC services"
                  lines={[
                    "Split & window AC service",
                    "Jet pump deep clean",
                    "Installation / uninstall",
                  ]}
                />
                <HeroMiniCard
                  icon="💡"
                  title="Electrician"
                  lines={[
                    "Fan & lights fitting",
                    "Switch / socket repair",
                    "MCB / DB troubleshooting",
                  ]}
                />
              </div>
            </div>

            {/* Right – 4 step phones (mobile-friendly, animated) */}
            <div className="flex justify-center lg:justify-end mt-2 lg:mt-0">
              <div className="w-full max-w-xl relative">
                {/* glow under phones */}
                <div className="pointer-events-none absolute inset-x-6 -bottom-4 h-14 rounded-full bg-cyan-400/30 blur-3xl" />

                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] text-slate-200">
                    Mobile booking preview (4 steps)
                  </p>
                  <span className="hidden sm:inline-flex text-[10px] px-2 py-1 rounded-full bg-slate-900/60 border border-white/15 text-slate-100/80">
                    Simple & fast
                  </span>
                </div>

                {/* GRID: mobile 2×2, desktop 4 in a row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 place-items-center">
                  <AnimatedPhoneStepCard
                    index={0}
                    step="Step 1"
                    title="Choose service"
                    desc="AC / electrician service select karo."
                    highlight="Popular: AC General Service"
                    tilt="left"
                  />
                  <AnimatedPhoneStepCard
                    index={1}
                    step="Step 2"
                    title="Pick time slot"
                    desc="10 AM – 6 PM ke beech comfortable slot choose karo."
                    highlight="10–11 · 2–3 · 4–5"
                    tilt="slight-left"
                  />
                  <AnimatedPhoneStepCard
                    index={2}
                    step="Step 3"
                    title="Fill details"
                    desc="Name, phone & address add karo for doorstep visit."
                    highlight="Auto-location support"
                    tilt="slight-right"
                  />
                  <AnimatedPhoneStepCard
                    index={3}
                    step="Step 4"
                    title="Booking confirm"
                    desc="Summary screen dikhti hai, uske baad team WhatsApp / call se confirm karti hai."
                    highlight="Instant booking confirmation"
                    tilt="right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========== MAIN ========== */}
      {/* bottom nav cut na kare isliye pb-28 */}
      <main className="flex-1 pb-28">
        {/* SERVICES GRID */}
        <section className="max-w-6xl mx-auto px-4 pt-6 pb-4">
          <SectionHeader
            title="Popular AC & electrician services"
            subtitle="Slot-based booking · Limited engineers available per day"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-[11px]">
            <ServiceCard
              title="Split AC General Service"
              subtitle="Cooling issue, foul smell, low airflow"
              badge="Most booked"
              price="From ₹399"
            />
            <ServiceCard
              title="Window AC Service"
              subtitle="Routine cleaning & filter wash"
              badge="Summer essential"
              price="From ₹349"
            />
            <ServiceCard
              title="AC Jet Pump Deep Clean"
              subtitle="High pressure internal cleaning"
              badge="Premium care"
              price="From ₹699"
            />
            <ServiceCard
              title="AC Install / Uninstall"
              subtitle="New AC fitment or shifting"
              badge="Expert only"
              price="From ₹1199"
            />
            <ServiceCard
              title="Quick Electrician Visit"
              subtitle="Fan, lights, switches, sockets"
              badge="Up to 1 hour"
              price="Visit from ₹149"
            />
            <ServiceCard
              title="Fan & Light Fitting"
              subtitle="Ceiling fan, tube light, panel lights"
              badge="Per point"
              price="From ₹129"
            />
            <ServiceCard
              title="MCB / DB Work"
              subtitle="Tripping, overload, DB optimisation"
              badge="Safety first"
              price="On inspection"
            />
            <ServiceCard
              title="Minor Wiring Jobs"
              subtitle="Small wiring fixes & corrections"
              badge="Local expert"
              price="As per work"
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="max-w-6xl mx-auto px-4 pb-4">
          <SectionHeader
            title="AiroFix ka 3-step flow"
            subtitle="Clear steps · Transparent communication"
          />
          <div className="grid gap-3 md:grid-cols-3 text-[11px]">
            <StepCard
              icon="🧾"
              title="1. Service & slot choose karo"
              desc="AC / electrician service select karo, date & preferred time slot choose karo, basic details fill karo."
            />
            <StepCard
              icon="🧑‍🔧"
              title="2. Technician assign hota hai"
              desc="Team nearest verified technician assign karti hai. Aapko name & timing WhatsApp / call se mil jaata hai."
            />
            <StepCard
              icon="✅"
              title="3. Visit, kaam & payment"
              desc="Technician visit karke kaam complete karta hai, aap cash / UPI / online se pay kar sakte ho. Simple billing milti hai."
            />
          </div>
        </section>

        {/* WHY AIROFIX */}
        <section className="max-w-6xl mx-auto px-4 pb-4">
          <SectionHeader
            title="Why AiroFix?"
            subtitle="Urban Company style clarity, local comfort"
          />
          <div className="grid gap-3 md:grid-cols-3 text-[11px]">
            <InfoCard
              title="Urban style, local pricing"
              desc="Rate card structure Urban Company jaisa clear, lekin pricing local market reality ke hisaab se rakhi jaati hai."
            />
            <InfoCard
              title="Verified & trained partners"
              desc="Technicians ka KYC, skill check & behaviour screening hota hai. Repeat feedback history track hoti hai."
            />
            <InfoCard
              title="Live coordination & updates"
              desc="Booking hone ke baad timing, technician aur status ke clear updates WhatsApp / call ke through milte rehte hain."
            />
          </div>
        </section>

        {/* MINI RATE CARD */}
        <section id="rate-card" className="max-w-6xl mx-auto px-4 pb-4">
          <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 text-[11px] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <p className="text-xs font-semibold text-slate-900">
                Sample rate card – AC services
              </p>
              <span className="text-[10px] text-slate-500">
                Exact price brand / tonnage / issue ke hisaab se final hoga
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <RateRow
                label="Split AC General Service"
                details="Indoor + outdoor, basic cleaning & checks"
                price="₹399 – ₹549"
              />
              <RateRow
                label="Window AC General Service"
                details="Filter cleaning, coil cleaning, performance check"
                price="₹349 – ₹499"
              />
              <RateRow
                label="Jet Pump Deep Clean (Split)"
                details="High pressure jet pump, deep internal cleaning"
                price="₹699 – ₹899"
              />
              <RateRow
                label="Gas check / top-up"
                details="Leak check, required top-up only"
                price="As per diagnosis"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Note: Multi-unit / complex jobs par technician visit ke baad
              custom quote share hota hai. Aap proceed karne se pehle clear
              pricing dekh sakte hain.
            </p>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="max-w-6xl mx-auto px-4 pb-4">
          <SectionHeader
            title="Log kya bolte hain"
            subtitle="Real feedback, local customers"
          />
          <div className="grid gap-3 md:grid-cols-3 text-[11px]">
            <TestimonialCard
              name="Rahul · Dwarka"
              text="AC service neat & clean tha, engineer time par aaya. Urban Company se experience milta-julta, but pricing better lagi."
              rating="4.9"
            />
            <TestimonialCard
              name="Simran · Janakpuri"
              text="Fan & lights ka kaam karaaya, electrician soft-spoken tha, kaam ke beech me extra charges ka drama nahi hua."
              rating="4.8"
            />
            <TestimonialCard
              name="Verma Ji · Uttam Nagar"
              text="Office ke 4 AC same din service kara diye. Communication clear tha, isliye coordination easy raha."
              rating="5.0"
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 text-[11px] shadow-sm">
            <p className="text-xs font-semibold text-slate-900 mb-2">
              FAQs – common questions
            </p>
            <div className="space-y-1.5">
              <FAQItem
                q="Booking ke baad confirmation kaise aata hai?"
                a="Form submit hone ke baad AiroFix team aapko call / WhatsApp par slot confirm karti hai, technician ka naam & timing share hota hai."
              />
              <FAQItem
                q="Payment options kya-kya hain?"
                a="Aap cash, UPI, QR ya future me payment gateway se pay kar sakte hain. Service complete hone par aapko simple bill / job summary milti hai."
              />
              <FAQItem
                q="Kya service warranty milta hai?"
                a="Kaafi services par limited period workmanship warranty hoti hai (7–15 days). Ye service type & issue ke hisaab se decide hotta hai."
              />
              <FAQItem
                q="App ke bina bhi booking ho jayegi?"
                a="Haan, ye website hi app-jaisi design ki gayi hai. Mobile browser se khol ke aap seedha service, slot & address choose karke booking kar sakte hain."
              />
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-6xl mx-auto px-4 pb-7">
          <div
            className="rounded-3xl px-4 py-4 sm:px-6 sm:py-5 text-xs text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{
              background:
                "linear-gradient(135deg, #0F172A 0%, #1D4ED8 35%, #22C1C3 100%)",
            }}
          >
            <div>
              <p className="text-sm font-semibold">
                Ready to book your AC / electrician service?
              </p>
              <p className="text-[11px] text-slate-100 mt-0.5">
                30 seconds ka booking form, uske baad complete coordination
                AiroFix handle karega. Weekends par slots jaldi fill ho jaate
                hain, isliye pehle se book karna better hai.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/book"
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-xs font-semibold text-slate-900 bg-white shadow-sm active:scale-[0.97] transition"
              >
                🚀 Book now
              </Link>
              <a
                href="https://wa.me/917289026947"
                target="_blank"
                className="inline-flex items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-semibold border border-white/60 bg-white/5 text-white hover:bg-white/10 active:scale-[0.97] transition"
              >
                💬 WhatsApp par baat karein
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* COPYRIGHT FOOTER */}
      <footer className="px-4 pt-1 pb-2 text-center text-[10px] text-slate-400">
        © {new Date().getFullYear()} AiroFix Services · A unit of Parth
        Enterprises
      </footer>

      {/* FLOATING WHATSAPP */}
      <a
        href="https://wa.me/917289026947"
        target="_blank"
        className="fixed bottom-16 right-4 z-30 h-11 w-11 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center text-white text-xl active:scale-95 transition"
        aria-label="Chat on WhatsApp"
      >
        💬
      </a>

      {/* BOTTOM NAV – only customer tabs */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
        <div className="max-w-md mx-auto flex items-center justify-around py-1.5 text-[11px]">
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 text-blue-600"
          >
            <span>🏠</span>
            <span className="font-semibold">Home</span>
          </Link>
          <Link
            href="/book"
            className="flex flex-col items-center gap-0.5 text-slate-500"
          >
            <span>🧾</span>
            <span>Book</span>
          </Link>
        </div>
      </nav>

      {/* HIDDEN ADMIN LINK – sirf desktop, low opacity */}
      <div className="hidden md:block text-[9px] text-center text-slate-400 pb-1 pt-1">
        <Link href="/admin" className="opacity-30 hover:opacity-80 transition">
          Admin
        </Link>
      </div>
    </div>
  );
}

/* ========= SMALL COMPONENTS ========= */

function StatPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 border border-white/15">
      {label}
    </span>
  );
}

type HeroMiniCardProps = {
  icon: string;
  title: string;
  lines: string[];
};

function HeroMiniCard({ icon, title, lines }: HeroMiniCardProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/15 px-3 py-2 text-[11px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <p className="font-semibold">{title}</p>
      </div>
      <ul className="space-y-0.5 text-slate-200/90">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-1">
            <span className="mt-[2px] text-[9px]">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------- Animated phone cards --------- */

type PhoneStepContentProps = {
  step: string;
  title: string;
  desc: string;
  highlight: string;
};

type AnimatedPhoneStepCardProps = PhoneStepContentProps & {
  index: number;
  tilt?: "left" | "slight-left" | "slight-right" | "right";
};

function AnimatedPhoneStepCard({
  step,
  title,
  desc,
  highlight,
  index,
  tilt = "slight-left",
}: AnimatedPhoneStepCardProps) {
  const tiltClass =
    tilt === "left"
      ? "-rotate-4"
      : tilt === "slight-left"
      ? "-rotate-2"
      : tilt === "slight-right"
      ? "rotate-2"
      : "rotate-4";

  return (
    <div
      className={`w-full max-w-[170px] mx-auto opacity-0 transform-gpu ${tiltClass}`}
      style={{
        animation: "phoneSlideIn 0.7s ease-out forwards",
        animationDelay: `${index * 0.12}s`,
      }}
    >
      <div className="relative w-full h-[230px] sm:h-[250px] rounded-[24px] bg-slate-950 border-[4px] border-slate-900 shadow-[0_18px_50px_rgba(56,189,248,0.55)] overflow-hidden transform-gpu transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_24px_80px_rgba(56,189,248,0.8)] hover:rotate-0">
        {/* inner glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.17),_transparent_55%)]" />
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-b-2xl z-10" />
        {/* screen */}
        <div className="relative z-0 h-full w-full bg-slate-50 flex flex-col pt-6 pb-3 px-3">
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-blue-600">{step}</p>
            <p className="text-[11px] font-semibold text-slate-900">
              {title}
            </p>
          </div>
          <p className="text-[9px] text-slate-500 mb-2 flex-1">{desc}</p>
          <div className="mt-auto">
            <p className="text-[9px] text-slate-500 mb-0.5">
              On-screen highlight
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-2 py-1">
              <p className="text-[9px] font-semibold text-slate-800 line-clamp-2">
                {highlight}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------- Rest of smaller components --------- */

type SectionHeaderProps = {
  title: string;
  subtitle: string;
};

function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex flex-col gap-0.5">
      <p className="text-xs font-semibold text-slate-900">{title}</p>
      <p className="text-[11px] text-slate-500">{subtitle}</p>
    </div>
  );
}

type ServiceCardProps = {
  title: string;
  subtitle: string;
  badge?: string;
  price?: string;
};

function ServiceCard({ title, subtitle, badge, price }: ServiceCardProps) {
  return (
    <Link
      href="/book"
      className="group rounded-2xl bg-white border border-slate-200 p-3 flex flex-col justify-between hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition"
    >
      <div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-[12px] font-semibold text-slate-900">{title}</p>
          {badge && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
          {subtitle}
        </p>
      </div>
      {price && (
        <p className="mt-2 text-[11px] font-semibold text-blue-700">
          {price}
        </p>
      )}
    </Link>
  );
}

type StepCardProps = {
  icon: string;
  title: string;
  desc: string;
};

function StepCard({ icon, title, desc }: StepCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-3 flex gap-2">
      <div className="h-8 w-8 rounded-2xl bg-blue-50 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div>
        <p className="text-[12px] font-semibold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-600 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

type InfoCardProps = {
  title: string;
  desc: string;
};

function InfoCard({ title, desc }: InfoCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-3">
      <p className="text-[12px] font-semibold text-slate-900 mb-1">{title}</p>
      <p className="text-[11px] text-slate-600">{desc}</p>
    </div>
  );
}

type RateRowProps = {
  label: string;
  details: string;
  price: string;
};

function RateRow({ label, details, price }: RateRowProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-start justify-between gap-2">
      <div>
        <p className="text-[11px] font-semibold text-slate-900">{label}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">{details}</p>
      </div>
      <p className="text-[11px] font-semibold text-blue-700 whitespace-nowrap">
        {price}
      </p>
    </div>
  );
}

type TestimonialProps = {
  name: string;
  text: string;
  rating: string;
};

function TestimonialCard({ name, text, rating }: TestimonialProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-3 flex flex-col justify-between">
      <p className="text-[11px] text-slate-600">“{text}”</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-900">{name}</p>
        <p className="text-[10px] text-amber-500">⭐ {rating}</p>
      </div>
    </div>
  );
}

type FAQItemProps = {
  q: string;
  a: string;
};

function FAQItem({ q, a }: FAQItemProps) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <summary className="cursor-pointer list-none text-[11px] font-semibold text-slate-900 flex items-center justify-between gap-2">
        <span>{q}</span>
        <span className="text-slate-400 text-xs">+</span>
      </summary>
      <p className="mt-1.5 text-[11px] text-slate-600">{a}</p>
    </details>
  );
}
