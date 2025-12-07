import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

// GET – last 100 bookings
export async function GET() {
  try {
    const snap = await adminDb
      .ref("bookings")
      .orderByChild("createdAt")
      .limitToLast(100)
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // future fields (engineer, payment etc.) yahan add ho sakte hain
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

// PUT – bulk status update OR single booking update (status / assignedEngineer etc.)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const now = Date.now();

    // 1) BULK STATUS UPDATE: { ids: string[], status: "completed" }
    if (Array.isArray(body.ids) && body.ids.length && body.status) {
      const updates: Record<string, any> = {};

      body.ids.forEach((id: string) => {
        updates[`${id}/status`] = body.status;
        updates[`${id}/updatedAt`] = now;
      });

      await adminDb.ref("bookings").update(updates);

      return NextResponse.json({ success: true, mode: "bulk-status" });
    }

    // 2) SINGLE BOOKING UPDATE: { id, status?, assignedEngineer? ... }
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Missing booking id for update." },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // yahi important part hai engineer assign ke liye
    if (body.assignedEngineer !== undefined) {
      // agar empty string bhejo to null kar denge (unassign)
      updateData.assignedEngineer = body.assignedEngineer || null;
    }

    // agar future me paymentStatus, paymentMode waqera add karne ho to yahan:
    // if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
    // if (body.paymentMode !== undefined) updateData.paymentMode = body.paymentMode;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update." },
        { status: 400 }
      );
    }

    updateData.updatedAt = now;

    await adminDb.ref("bookings").child(body.id).update(updateData);

    return NextResponse.json({ success: true, mode: "single-update" });
  } catch (e: any) {
    console.error("BOOKINGS PUT ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to update booking(s)" },
      { status: 500 }
    );
  }
}
