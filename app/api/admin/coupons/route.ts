import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await adminDb.ref("coupons").get();
    const val = snap.val() || {};
    const list = Object.keys(val).map((id) => ({ id, ...val[id] }));
    list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    return NextResponse.json({ success: true, coupons: list });
  } catch (e: any) {
    console.error("COUPONS GET ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ref = adminDb.ref("coupons").push();
    const id = ref.key as string;
    const data = {
      id,
      code: (body.code || "").toUpperCase(),
      description: body.description || "",
      discountType: body.discountType || "percentage", // "percentage" | "flat"
      discountValue: Number(body.discountValue || 0),
      maxDiscount: Number(body.maxDiscount || 0),
      minOrderAmount: Number(body.minOrderAmount || 0),
      validFrom: body.validFrom || "",
      validTo: body.validTo || "",
      isActive: body.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await ref.set(data);
    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    console.error("COUPONS POST ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon id is required" },
        { status: 400 }
      );
    }
    const ref = adminDb.ref(`coupons/${id}`);
    await ref.update({
      ...rest,
      updatedAt: Date.now(),
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("COUPONS PUT ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon id is required" },
        { status: 400 }
      );
    }
    await adminDb.ref(`coupons/${id}`).remove();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("COUPONS DELETE ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
