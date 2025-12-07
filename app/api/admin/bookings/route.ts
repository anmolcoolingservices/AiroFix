import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

// GET – last 200 bookings
export async function GET() {
  try {
    const snap = await adminDb
      .ref("bookings")
      .orderByChild("createdAt")
      .limitToLast(200)
      .get();

    const val = snap.val() || {};
    const list = Object.keys(val)
      .map((id) => ({ id, ...val[id] }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ success: true, bookings: list });
  } catch (e: any) {
    console.error("BOOKINGS GET ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST – save new booking from website form
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const ref = adminDb.ref("bookings").push();
    const id = ref.key as string;

    const data = {
      id,
      customerName: body.customerName || "",
      phone: body.phone || "",
      email: body.email || "",
      serviceType: body.serviceType || "",
      categoryName: body.categoryName || "",
      itemName: body.itemName || "",
      approxPrice: body.approxPrice || "",
      addressLine1: body.addressLine1 || "",
      addressLine2: body.addressLine2 || "",
      city: body.city || "",
      pincode: body.pincode || "",
      date: body.date || "",
      slot: body.slot || "",
      notes: body.notes || "",
      source: body.source || "web",
      status: "pending",
      // optional future fields (safe even if null)
      paymentMethod: body.paymentMethod || null,
      paymentStatus: body.paymentStatus || "pending",
      assignedEngineer: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await ref.set(data);

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    console.error("BOOKINGS POST ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// PUT – bulk status update OR single booking update (status / engineer)
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // 1) BULK STATUS UPDATE: { ids: string[], status: string }
    if (Array.isArray(body.ids) && body.ids.length && body.status) {
      const ts = Date.now();
      const updates: Record<string, any> = {};

      body.ids.forEach((id: string) => {
        updates[`${id}/status`] = body.status;
        updates[`${id}/updatedAt`] = ts;
      });

      await adminDb.ref("bookings").update(updates);
      return NextResponse.json({ success: true });
    }

    // 2) SINGLE BOOKING UPDATE
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Booking id required" },
        { status: 400 }
      );
    }

    const updateData: any = { updatedAt: Date.now() };

    if (body.status) {
      updateData.status = body.status;
    }

    // assignedEngineer: phone (last 10 digits) or null to unassign
    if (body.assignedEngineer !== undefined) {
      if (body.assignedEngineer) {
        updateData.assignedEngineer = body.assignedEngineer;
      } else {
        updateData.assignedEngineer = null;
      }
    }

    await adminDb.ref("bookings").child(body.id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("BOOKINGS PUT ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to update bookings" },
      { status: 500 }
    );
  }
}
