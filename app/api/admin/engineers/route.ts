import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await adminDb.ref("engineers").get();
    const val = snap.val() || {};
    const list = Object.keys(val).map((id) => ({ id, ...val[id] }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return NextResponse.json({ success: true, engineers: list });
  } catch (e: any) {
    console.error("ENGINEERS GET ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch engineers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ref = adminDb.ref("engineers").push();
    const id = ref.key as string;
    const data = {
      id,
      name: body.name || "",
      phone: body.phone || "",
      location: body.location || "",
      serviceType: body.serviceType || "ac", // "ac" | "electrician" | "both"
      notes: body.notes || "",
      isActive: body.isActive ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await ref.set(data);
    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    console.error("ENGINEERS POST ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to create engineer" },
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
        { success: false, error: "Engineer id is required" },
        { status: 400 }
      );
    }
    const ref = adminDb.ref(`engineers/${id}`);
    await ref.update({
      ...rest,
      updatedAt: Date.now(),
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("ENGINEERS PUT ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to update engineer" },
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
        { success: false, error: "Engineer id is required" },
        { status: 400 }
      );
    }
    await adminDb.ref(`engineers/${id}`).remove();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("ENGINEERS DELETE ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to delete engineer" },
      { status: 500 }
    );
  }
}
