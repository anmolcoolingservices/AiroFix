// app/api/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 ghante

// Helper: URL se bookingId nikaalo (no params drama)
function getBookingIdFromReq(req: NextRequest): string {
  const { pathname } = req.nextUrl;
  // /api/bookings/<id>/cancel
  const parts = pathname.split("/").filter(Boolean); // ["api","bookings","<id>","cancel"]
  return parts[2] || "";
}

export async function POST(req: NextRequest) {
  try {
    const bookingId = getBookingIdFromReq(req);

    console.log("Cancel route → pathname:", req.nextUrl.pathname, "bookingId:", bookingId);

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID missing hai." },
        { status: 400 }
      );
    }

    // 🔹 Optional: cancellation reason body se lo (agar body hai to)
    let reason = "";
    try {
      const body = await req
        .json()
        .catch(() => null as any);

      if (body) {
        reason =
          body.reason ||
          body.cancellationReason ||
          body.note ||
          "";
      }
    } catch {
      // body missing / invalid ho to ignore
    }

    // 🔍 Booking fetch
    const snap = await adminDb.ref(`bookings/${bookingId}`).get();
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Booking nahi mili." },
        { status: 404 }
      );
    }

    const booking = snap.val() as any;

    // Already cancelled / completed?
    const currentStatus = (booking.status || "").toLowerCase();
    if (
      currentStatus === "cancelled" ||
      currentStatus === "cancelled_by_customer" ||
      currentStatus === "cancelled_by_admin" ||
      currentStatus === "completed"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking pehle hi completed / cancelled hai. Ab cancel nahi ho sakti.",
          status: booking.status,
        },
        { status: 400 }
      );
    }

    // ⏱ 12 hours rule
    const now = Date.now();
    let slotStartTs: number | null = null;

    if (typeof booking.startTs === "number") {
      slotStartTs = booking.startTs;
    } else if (typeof booking.scheduledAt === "number") {
      slotStartTs = booking.scheduledAt;
    }

    if (slotStartTs) {
      const diff = slotStartTs - now;
      if (diff < TWELVE_HOURS_MS) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Ye booking ab cancel nahi ki ja sakti. Appointment time se 12 ghante se kam bacha hai.",
            code: "TOO_CLOSE_TO_SLOT",
            slotStartTs,
            now,
          },
          { status: 400 }
        );
      }
    }

    // ✅ Cancellation allowed – update booking
    const updates: any = {
      status: "cancelled_by_customer", // main status
      cancelledAt: now,
      cancelledBy: "customer",
      updatedAt: now,
    };

    if (reason) {
      updates.cancellationReason = reason;
    }

    await adminDb.ref(`bookings/${bookingId}`).update(updates);

    return NextResponse.json({
      success: true,
      bookingId,
      newStatus: updates.status,
    });
  } catch (e: any) {
    console.error("Cancel booking API error:", e);
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "Server error while cancelling booking.",
      },
      { status: 500 }
    );
  }
}
