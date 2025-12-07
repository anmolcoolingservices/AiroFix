import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

// GET – returns list with firebaseKey + consistent isActive flag
export async function GET() {
  try {
    const snap = await adminDb.ref("services").get();
    const val = snap.val() || {};

    const list = Object.keys(val).map((key) => {
      const item = val[key] || {};

      // Normalise active state
      const enabled =
        typeof item.enabled === "boolean" ? item.enabled : true;
      const isActive =
        typeof item.isActive === "boolean" ? item.isActive : enabled;

      return {
        firebaseKey: key,             // internal
        id: item.id || key,           // "svc_ac" etc
        name: item.name || "",
        type: item.type || "ac",
        description: item.description || "",
        displayPrice: item.displayPrice || "",
        imageUrl: item.imageUrl || "",
        priceMode: item.priceMode || "fixed",
        visitFee: item.visitFee ?? 0,
        rating: item.rating ?? 0,
        totalJobs: item.totalJobs ?? 0,
        enabled,
        isActive,
        createdAt: item.createdAt ?? null,
        updatedAt: item.updatedAt ?? null,
      };
    });

    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return NextResponse.json({ success: true, services: list });
  } catch (e: any) {
    console.error("SERVICES GET ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST – creates service with both enabled + isActive
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ref = adminDb.ref("services").push();
    const firebaseKey = ref.key as string;

    const enabled =
      typeof body.enabled === "boolean"
        ? body.enabled
        : typeof body.isActive === "boolean"
        ? body.isActive
        : true;

    const data = {
      firebaseKey,
      id: body.id || firebaseKey, // allow custom IDs like "svc_ac"
      name: body.name || "",
      type: body.type || "ac",
      description: body.description || "",
      displayPrice: body.displayPrice || "",
      imageUrl: body.imageUrl || "",
      priceMode: body.priceMode || "fixed",
      visitFee: body.visitFee ?? 0,
      rating: body.rating ?? 0,
      totalJobs: body.totalJobs ?? 0,
      enabled,
      isActive: enabled,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await ref.set(data);
    return NextResponse.json({ success: true, id: data.id });
  } catch (e: any) {
    console.error("SERVICES POST ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to create service" },
      { status: 500 }
    );
  }
}

// PUT – accepts firebaseKey + partial data, keeps active flags in sync
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { firebaseKey, ...rest } = body;

    if (!firebaseKey) {
      return NextResponse.json(
        { success: false, error: "firebaseKey is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      ...rest,
      updatedAt: Date.now(),
    };

    // Normalise enabled / isActive, in case admin UI only sends one
    if (typeof rest.isActive === "boolean") {
      updateData.enabled = rest.isActive;
    } else if (typeof rest.enabled === "boolean") {
      updateData.isActive = rest.enabled;
    }

    const ref = adminDb.ref(`services/${firebaseKey}`);
    await ref.update(updateData);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("SERVICES PUT ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE – uses firebaseKey
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { firebaseKey } = body;

    if (!firebaseKey) {
      return NextResponse.json(
        { success: false, error: "firebaseKey is required" },
        { status: 400 }
      );
    }

    await adminDb.ref(`services/${firebaseKey}`).remove();

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("SERVICES DELETE ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
