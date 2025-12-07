import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const APP_ID = process.env.CASHFREE_APP_ID!;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const ENV = process.env.CASHFREE_ENV === "prod" ? "prod" : "sandbox";

const LINKS_BASE_URL =
  ENV === "prod"
    ? "https://api.cashfree.com/pg/links"
    : "https://sandbox.cashfree.com/pg/links";

if (!APP_ID || !SECRET_KEY) {
  console.warn("⚠️ CASHFREE_APP_ID / SECRET_KEY missing for verify route.");
}

type CashfreeOrderForLink = {
  cf_order_id?: string;
  order_id?: string;
  order_status?: string; // ACTIVE / PAID / EXPIRED / ...
  order_amount?: number;
  payment_session_id?: string;
  [key: string]: any;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bookingId = body.bookingId as string | undefined;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "bookingId missing in verify request." },
        { status: 400 }
      );
    }

    // 1) Booking fetch karo – payment link ka link_id yahin se milega
    const snap = await adminDb.ref(`bookings/${bookingId}`).get();
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Booking not found for verification." },
        { status: 404 }
      );
    }

    const booking = snap.val() || {};
    const gateway = booking.paymentGateway;
    const linkId =
      booking.paymentOrderId || booking.linkId || booking.cashfreeLinkId;

    if (gateway !== "cashfree" || !linkId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cashfree payment link ka data booking me nahi mila. (paymentGateway / linkId missing)",
        },
        { status: 400 }
      );
    }

    if (!APP_ID || !SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cashfree credentials missing. CASHFREE_APP_ID / CASHFREE_SECRET_KEY set karo.",
        },
        { status: 500 }
      );
    }

    // 2) Cashfree se "Get Orders for a Payment Link"
    const url = `${LINKS_BASE_URL}/${encodeURIComponent(linkId)}/orders`;

    const cfRes = await fetch(url, {
      method: "GET",
      headers: {
        "x-client-id": APP_ID,
        "x-client-secret": SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    if (!cfRes.ok) {
      const cfErr = await cfRes.json().catch(() => ({}));
      console.error("Cashfree verify error:", cfErr);
      return NextResponse.json(
        {
          success: false,
          error: cfErr?.message || "Cashfree verify API failed.",
          raw: cfErr,
        },
        { status: 400 }
      );
    }

    const cfJson = (await cfRes.json()) as CashfreeOrderForLink[] | any;
    console.log("Cashfree verify orders-for-link response:", cfJson);

    const orders: CashfreeOrderForLink[] = Array.isArray(cfJson)
      ? cfJson
      : [];

    if (!orders.length) {
      return NextResponse.json({
        success: true,
        paymentStatus: booking.paymentStatus || "pending",
        cfStatus: "NO_ORDERS",
        message:
          "Payment link ke against koi order nahi mila. Shayad user ne payment flow complete nahi kiya.",
      });
    }

    // Simple approach: sabse latest order ko dekh lo (usually index 0)
    const latestOrder = orders[0];
    const cfStatus = (latestOrder.order_status || "").toUpperCase();

    let newPaymentStatus: string = booking.paymentStatus || "pending";

    if (cfStatus === "PAID") {
      newPaymentStatus = "paid";
    } else if (cfStatus === "EXPIRED" || cfStatus === "TERMINATED") {
      newPaymentStatus = "failed";
    } else {
      // ACTIVE / kuch aur → pending hi treat karo
      newPaymentStatus = booking.paymentStatus || "pending";
    }

    // 3) Booking me status update
    await adminDb.ref(`bookings/${bookingId}`).update({
      paymentStatus: newPaymentStatus,
      cashfreeLastStatus: cfStatus,
      cashfreeLastCheckAt: Date.now(),
      cashfreeLastOrderId:
        latestOrder.order_id || latestOrder.cf_order_id || null,
    });

    return NextResponse.json({
      success: true,
      paymentStatus: newPaymentStatus,
      cfStatus,
      cfRaw: cfJson,
    });
  } catch (e: any) {
    console.error("Cashfree verify route error:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message ||
          "Server error while verifying Cashfree payment status.",
      },
      { status: 500 }
    );
  }
}
