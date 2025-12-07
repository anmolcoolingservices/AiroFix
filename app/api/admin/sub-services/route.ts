import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

// GET – flatten nested subServices => flat list with serviceId + isActive
export async function GET() {
  try {
    const snap = await adminDb.ref("subServices").get();
    const val = snap.val() || {};

    const list: any[] = [];

    // val = { [serviceId]: { [subServiceId]: data } }
    Object.entries(val).forEach(([serviceId, group]: any) => {
      if (!group || typeof group !== "object") return;

      Object.entries(group).forEach(([subId, data]: any) => {
        if (!data) return;

        const enabled =
          typeof data.enabled === "boolean" ? data.enabled : true;
        const isActive =
          typeof data.isActive === "boolean" ? data.isActive : enabled;

        list.push({
          id: subId,
          serviceId,
          name: data.name || "",
          description: data.description || "",
          // Map price fields into priceFrom / priceTo (strings)
          priceFrom:
            data.priceFrom ??
            (typeof data.price === "number"
              ? String(data.price)
              : data.price || ""),
          priceTo:
            data.priceTo ??
            (typeof data.maxPrice === "number"
              ? String(data.maxPrice)
              : data.maxPrice || ""),
          approxDuration:
            data.approxDuration ??
            (data.durationMins ? `${data.durationMins} mins` : ""),
          isActive,
          enabled,
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        });
      });
    });

    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return NextResponse.json({ success: true, subServices: list });
  } catch (e: any) {
    console.error("SUBSERVICES GET ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sub-services" },
      { status: 500 }
    );
  }
}

// POST – creates sub-service under specific serviceId (nested)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serviceId } = body;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: "serviceId is required" },
        { status: 400 }
      );
    }

    const ref = adminDb.ref(`subServices/${serviceId}`).push();
    const id = ref.key as string;

    const enabled =
      typeof body.enabled === "boolean"
        ? body.enabled
        : typeof body.isActive === "boolean"
        ? body.isActive
        : true;

    const data = {
      id,
      name: body.name || "",
      description: body.description || "",
      price: body.price ?? body.priceFrom ?? null,
      priceFrom: body.priceFrom ?? null,
      priceTo: body.priceTo ?? null,
      approxDuration: body.approxDuration || "",
      durationMins: body.durationMins ?? null,
      enabled,
      isActive: enabled,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await ref.set(data);
    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    console.error("SUBSERVICES POST ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to create sub-service" },
      { status: 500 }
    );
  }
}

// PUT – update single sub-service under serviceId
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, serviceId, ...rest } = body;

    if (!id || !serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "subService id and serviceId are required",
        },
        { status: 400 }
      );
    }

    const ref = adminDb.ref(`subServices/${serviceId}/${id}`);

    const updateData: any = {
      ...rest,
      updatedAt: Date.now(),
    };

    // Normalise priceFrom -> price
    if (rest.priceFrom && !rest.price) {
      updateData.price = rest.priceFrom;
    }

    // Normalise enabled/isActive flags so both stay in sync
    if (typeof rest.isActive === "boolean") {
      updateData.enabled = rest.isActive;
    } else if (typeof rest.enabled === "boolean") {
      updateData.isActive = rest.enabled;
    }

    await ref.update(updateData);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("SUBSERVICES PUT ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to update sub-service" },
      { status: 500 }
    );
  }
}

// DELETE – requires both id + serviceId
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, serviceId } = body;

    if (!id || !serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "subService id and serviceId are required",
        },
        { status: 400 }
      );
    }

    await adminDb.ref(`subServices/${serviceId}/${id}`).remove();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("SUBSERVICES DELETE ERR", e);
    return NextResponse.json(
      { success: false, error: "Failed to delete sub-service" },
      { status: 500 }
    );
  }
}
