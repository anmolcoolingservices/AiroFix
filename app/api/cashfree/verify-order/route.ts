// app/api/cashfree/verify-order/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || "sandbox"; // "prod" for live

function getBaseUrl() {
  return CASHFREE_ENV === "prod"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

export async function POST(req: Request) {
  try {
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cashfree credentials missing. Please set CASHFREE_APP_ID & CASHFREE_SECRET_KEY in env.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const bookingId = body.bookingId as string | undefined;
    const cfOrderId = body.cfOrderId as string | undefined;

    if (!bookingId || !cfOrderId) {
      return NextResponse.json(
        { success: false, error: "bookingId and cfOrderId are required." },
        { status: 400 }
      );
    }

    const url = `${getBaseUrl()}/orders/${encodeURIComponent(cfOrderId)}`;

    const cfRes = await fetch(url, {
      method: "GET",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json",
      },
    });

    if (!cfRes.ok) {
      const text = await cfRes.text().catch(() => "");
      console.error("Cashfree verify error:", cfRes.status, text);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify order with Cashfree.",
          statusCode: cfRes.status,
        },
        { status: 502 }
      );
    }

    const cfData: any = await cfRes.json();

    // Cashfree PG v2 style: order_status = "PAID", "ACTIVE", "EXPIRED" etc.
    const rawStatus =
      cfData.order_status || cfData.status || cfData.paymentStatus;
    const paymentStatus =
      rawStatus && typeof rawStatus === "string"
        ? rawStatus.toUpperCase()
        : "UNKNOWN";

    const isPaid =
      paymentStatus === "PAID" ||
      paymentStatus === "SUCCESS" ||
      paymentStatus === "COMPLETED";

    const amount =
      cfData.order_amount || cfData.orderAmount || cfData.amount || null;

    const paymentMethod =
      cfData.payment_method || cfData.payment_method || "online";

    // Firebase update
    const ref = adminDb.ref(`bookings/${bookingId}`);

    // Check if booking exists
    const snap = await ref.get();
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Booking not found in database." },
        { status: 404 }
      );
    }

    await ref.update({
      paymentStatus: isPaid ? "paid" : "unpaid",
      paymentGateway: "cashfree",
      paymentOrderId: cfOrderId,
      paymentAmount: amount,
      paymentMethod,
      paymentGatewayStatus: paymentStatus,
      paymentVerifiedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      isPaid,
      paymentStatus,
      amount,
      paymentMethod,
      raw: cfData, // optionally: remove if you don’t want full dump
    });
  } catch (e: any) {
    console.error("CASHFREE VERIFY ORDER ERR", e);
    return NextResponse.json(
      { success: false, error: "Internal error while verifying order." },
      { status: 500 }
    );
  }
}
