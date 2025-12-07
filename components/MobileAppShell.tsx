// components/MobileAppShell.tsx
"use client";

import { useState } from "react";
import { HomeTab } from "./tabs/HomeTab";
import { BookTab } from "./tabs/BookTab";
import { MyBookingsTab } from "./tabs/MyBookingsTab";
import { ProfileTab } from "./tabs/ProfileTab";
import BottomTabBar, { TabKey } from "./BottomTabBar";

export default function MobileAppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "book":
        return <BookTab />;
      case "bookings":
        return <MyBookingsTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <header className="px-4 py-3 flex items-center justify-between bg-slate-900/95">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            AiroFix
          </h1>
          <p className="text-xs text-slate-300">
            AC Service & Repair at your doorstep
          </p>
        </div>
        <button className="text-xs px-3 py-1 rounded-full border border-slate-600">
          Help
        </button>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-950/95 px-4 py-3">
        {renderTab()}
      </div>

      {/* Bottom Navigation */}
      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
