// components/BottomTabBar.tsx
"use client";

export type TabKey = "home" | "book" | "bookings" | "profile";

interface BottomTabBarProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "book", label: "Book", icon: "🛠️" },
  { key: "bookings", label: "My Bookings", icon: "📋" },
  { key: "profile", label: "Profile", icon: "👤" },
];

export default function BottomTabBar({
  activeTab,
  onChange,
}: BottomTabBarProps) {
  return (
    <nav className="h-14 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex flex-col items-center justify-center flex-1 text-[11px] ${
              isActive ? "text-teal-300" : "text-slate-400"
            }`}
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className={isActive ? "font-semibold" : ""}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
