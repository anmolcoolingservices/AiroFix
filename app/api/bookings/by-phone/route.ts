// app/api/bookings/by-phone/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneRaw = searchParams.get("phone");

    if (!phoneRaw) {
      return NextResponse.json(
        { success: false, error: "Phone missing in query." },
        { status: 400 }
      );
    }

    const digits = phoneRaw.replace(/\D/g, "");
    const normalized = digits.slice(-10); // last 10 digits

    if (!normalized) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number." },
        { status: 400 }
      );
    }

    const ref = adminDb.ref("bookings");

    // 1) Try userPhone
    const snapUser = await ref
      .orderByChild("userPhone")
      .equalTo(normalized)
      .get();

    const byId: Record<string, any> = {};

    if (snapUser.exists()) {
      const val = snapUser.val() || {};
      Object.entries(val).forEach(([id, b]) => {
        byId[id] = { id, ...(b as any) };
      });
    }

    // 2) Fallback: phone field (agar kahin userPhone store nahi hua)
    const snapPhone = await ref.orderByChild("phone").equalTo(normalized).get();
    if (snapPhone.exists()) {
      const val = snapPhone.val() || {};
      Object.entries(val).forEach(([id, b]) => {
        if (!byId[id]) {
          byId[id] = { id, ...(b as any) };
        }
      });
    }

    const bookings = Object.values(byId) as any[];

    // Latest first
    bookings.sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    return NextResponse.json({ success: true, bookings, phone: normalized });
  } catch (e: any) {
    console.error("GET /api/bookings/by-phone error:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message || "Server error while fetching bookings by phone.",
      },
      { status: 500 }
    );
  }
}
