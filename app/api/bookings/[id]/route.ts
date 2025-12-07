import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

// Helper: URL se bookingId nikaalo (no params drama)
function getBookingIdFromReq(req: NextRequest): string {
  const { pathname } = req.nextUrl;
  // /api/bookings/<id>
  const parts = pathname.split("/").filter(Boolean); // ["api","bookings","<id>"]
  return parts[2] || "";
}

// --------- GET /api/bookings/[id] ---------
export async function GET(req: NextRequest) {
  try {
    const bookingId = getBookingIdFromReq(req);

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID missing hai." },
        { status: 400 }
      );
    }

    const snap = await adminDb.ref(`bookings/${bookingId}`).get();
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Booking nahi mili." },
        { status: 404 }
      );
    }

    const booking = snap.val();

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        ...booking,
      },
    });
  } catch (e: any) {
    console.error("GET /api/bookings/[id] error:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message || "Server error while fetching booking details.",
      },
      { status: 500 }
    );
  }
}

// --------- PUT /api/bookings/[id] ---------
export async function PUT(req: NextRequest) {
  try {
    const bookingId = getBookingIdFromReq(req);

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID missing hai." },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Optional: yahan validation add kar sakte ho
    // For now: jo aaye use hi update kar rahe hain
    await adminDb.ref(`bookings/${bookingId}`).update({
      ...body,
      updatedAt: Date.now(),
    });

    // Updated snapshot wapas bhej dete hain
    const snap = await adminDb.ref(`bookings/${bookingId}`).get();
    const booking = snap.exists() ? snap.val() : null;

    return NextResponse.json({
      success: true,
      booking: booking
        ? {
            id: bookingId,
            ...booking,
          }
        : null,
    });
  } catch (e: any) {
    console.error("PUT /api/bookings/[id] error:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message || "Server error while updating booking.",
      },
      { status: 500 }
    );
  }
}
