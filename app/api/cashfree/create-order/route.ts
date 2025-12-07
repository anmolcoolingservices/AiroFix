import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const APP_ID = process.env.CASHFREE_APP_ID!;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const ENV = process.env.CASHFREE_ENV === "prod" ? "prod" : "sandbox";

// 🔁 Ab hum Orders nahi, Payment Links API use kar rahe hain
const PAYMENT_LINK_URL =
  ENV === "prod"
    ? "https://api.cashfree.com/pg/links"
    : "https://sandbox.cashfree.com/pg/links";

if (!APP_ID || !SECRET_KEY) {
  console.warn(
    "⚠️ CASHFREE_APP_ID ya CASHFREE_SECRET_KEY env missing hai. Payment create-order fail hoga."
  );
}

type CashfreeLinkResponse = {
  cf_link_id?: string | number;
  link_id?: string;
  link_url?: string;
  link_status?: string;
  link_amount?: number;
  link_currency?: string;
  message?: string;
  error?: string;
  [key: string]: any;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Body se aur fallback keys se bookingId nikaal lo
    const bookingId =
      body.bookingId || body.id || body.booking_id || body.booking_id;

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: "bookingId missing hai. Link dubara kholke try karein.",
        },
        { status: 400 }
      );
    }

    // 🔍 Booking fetch for defaults (safe)
    let bookingData: any = null;
    try {
      const snap = await adminDb.ref(`bookings/${bookingId}`).get();
      if (snap.exists()) {
        bookingData = snap.val();
      } else {
        console.warn(
          `⚠️ Cashfree create-order: booking ${bookingId} Firebase me nahi mila.`
        );
      }
    } catch (e) {
      console.warn("⚠️ Cashfree create-order: booking fetch error", e);
    }

    // ✅ Phone / name / email normalise (body -> booking -> fallback)
    let rawPhone = (
      body.phone ||
      bookingData?.phone ||
      bookingData?.userPhone ||
      ""
    ).toString().trim();

    // Sirf digits rakho
    let digits = rawPhone.replace(/\D/g, "");

    // Agar 0 se start ho raha hai aur length > 10 → leading zeros hata do
    if (digits.startsWith("0") && digits.length > 10) {
      digits = digits.replace(/^0+/, "");
    }

    // Agar "91........" jaisa pattern hai aur length > 10 → last 10 digits le lo
    if (digits.length > 10) {
      digits = digits.slice(-10);
    }

    // Agar ab bhi length weird ho (bahut chhota ya bahut bada) → fallback
    if (digits.length < 8 || digits.length > 13) {
      digits = "9999999999";
    }

    const finalPhone = digits;

    const finalName =
      body.customerName ||
      bookingData?.customerName ||
      bookingData?.name ||
      "AiroFix Customer";

    const finalEmail =
      body.email ||
      bookingData?.email ||
      "noemail+airofix@localplaceholder.com";

    // Debug ke liye
    console.log("Cashfree finalPhone raw/cleaned:", rawPhone, finalPhone);

    // ✅ Amount normalise – body.amount -> booking.amount/approxPrice -> ₹1
    let orderAmountRaw: number | undefined;

    if (
      body.amount !== undefined &&
      body.amount !== null &&
      body.amount !== ""
    ) {
      const n =
        typeof body.amount === "string"
          ? parseFloat(body.amount)
          : Number(body.amount);
      if (Number.isFinite(n) && n > 0) orderAmountRaw = n;
    }

    if (!orderAmountRaw && bookingData) {
      // try from bookingData.amount or approxPrice (e.g. "₹499 – ₹799")
      if (bookingData.amount) {
        const n = parseFloat(String(bookingData.amount).replace(/[^\d.]/g, ""));
        if (Number.isFinite(n) && n > 0) orderAmountRaw = n;
      } else if (bookingData.approxPrice) {
        const match = String(bookingData.approxPrice)
          .replace(/,/g, "")
          .match(/(\d+(\.\d+)?)/);
        if (match) {
          const n = parseFloat(match[1]);
          if (Number.isFinite(n) && n > 0) orderAmountRaw = n;
        }
      }
    }

    const orderAmount =
      orderAmountRaw && orderAmountRaw > 0 ? orderAmountRaw : 1; // minimum ₹1

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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 🔑 Payment Link ke liye unique link_id (max 50 chars)
    const rawLinkId = `AFIX_LINK_${bookingId}_${Date.now()}`;
    const linkId = rawLinkId.slice(0, 50);

    // 🧾 Payment Link payload (Cashfree docs ke hisaab se)
    const payload = {
      link_id: linkId,
      link_amount: orderAmount,
      link_currency: "INR",
      link_purpose: `AiroFix booking ${bookingId}`,
      customer_details: {
        customer_name: finalName,
        customer_phone: finalPhone,
        customer_email: finalEmail,
      },
      // optional, but useful:
      link_meta: {
        return_url: `${siteUrl}/booking/confirmation?id=${bookingId}&source=cashfree_link`,
      },
      link_auto_reminders: false,
      link_notify: {
        send_sms: false,
        send_email: false,
      },
      link_notes: {
        bookingId: String(bookingId),
      },
    };

    const cfRes = await fetch(PAYMENT_LINK_URL, {
      method: "POST",
      headers: {
        "x-client-id": APP_ID,
        "x-client-secret": SECRET_KEY,
        "x-api-version": "2023-08-01", // Payment Links ke liye bhi valid
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const cfJson = (await cfRes.json()) as CashfreeLinkResponse;
    console.log("Cashfree Payment Link response:", cfJson);

    if (!cfRes.ok) {
      console.error("Cashfree payment link create failed:", cfJson);
      return NextResponse.json(
        {
          success: false,
          error:
            cfJson?.message ||
            cfJson?.error ||
            "Cashfree se payment link create nahi ho paya.",
          raw: cfJson,
        },
        { status: 400 }
      );
    }

    // 🧷 Yahan se actual hosted checkout URL milta hai
    const paymentLink =
      cfJson.link_url ||
      (cfJson as any).payment_link || // fallback agar kabhi naye field aa jaye
      (cfJson as any).paymentLink;

    if (!paymentLink) {
      console.error(
        "Cashfree response me link_url/payment_link missing:",
        cfJson
      );
      return NextResponse.json(
        {
          success: false,
          error: "Payment link not received from Cashfree.",
          raw: cfJson,
        },
        { status: 400 }
      );
    }

    // Firebase booking me payment meta save
    try {
      await adminDb.ref(`bookings/${bookingId}`).update({
        paymentGateway: "cashfree",
        // Payment Link ke liye id alag hoti hai:
        paymentOrderId: cfJson.link_id || cfJson.cf_link_id || linkId,
        paymentLink,
        paymentStatus: "pending",
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn("⚠️ booking par payment meta save nahi hua:", e);
    }

    return NextResponse.json({
      success: true,
      paymentLink,
      // Reference ke liye
      linkId: cfJson.link_id || linkId,
      cfRaw: cfJson,
    });
  } catch (e: any) {
    console.error("Cashfree create-order route error:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message || "Server error while creating Cashfree payment link.",
      },
      { status: 500 }
    );
  }
}
