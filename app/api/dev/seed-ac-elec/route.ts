import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

async function runSeed() {
  const now = Date.now();

  // 1. Main services (AC + Electrician) – overwrite / create with fixed IDs
  const servicesUpdates: any = {
    svc_ac: {
      id: "svc_ac",
      name: "AC Services",
      type: "ac",
      basePrice: "₹399",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    svc_elec: {
      id: "svc_elec",
      name: "Electrician",
      type: "electrician",
      basePrice: "₹149",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  };

  await adminDb.ref("services").update(servicesUpdates);

  // 2. Sub-services (grouped by serviceId, same structure as tumhari RTDB)
  const acSub: any = {
    ac_basic: {
      id: "ac_basic",
      name: "AC Basic Service (Window AC)",
      description: "Filter clean, indoor unit wipe, basic outdoor check.",
      price: 399,
      durationMins: 90,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    ac_split_service: {
      id: "ac_split_service",
      name: "AC Basic Service (Split AC)",
      description: "Split AC filter cleaning + cooling check.",
      price: 499,
      durationMins: 90,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    ac_jet_deep: {
      id: "ac_jet_deep",
      name: "AC Jet Pump Deep Cleaning",
      description: "High-pressure jet deep cleaning for strong cooling.",
      price: 899,
      durationMins: 120,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    ac_install: {
      id: "ac_install",
      name: "AC Installation",
      description: "Split / window AC standard installation (up to 1.5 ton).",
      price: 1499,
      durationMins: 120,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    ac_uninstall: {
      id: "ac_uninstall",
      name: "AC Uninstallation",
      description: "Safe dismantling of AC with basic gas handling.",
      price: 699,
      durationMins: 60,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    ac_inspection: {
      id: "ac_inspection",
      name: "AC Repair (Inspection visit)",
      description: "Technician visit for diagnosis. Repair extra as per estimate.",
      price: 199,
      durationMins: 60,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
  };

  const elecSub: any = {
    elec_fan_install: {
      id: "elec_fan_install",
      name: "Ceiling Fan Installation / Replacement",
      description: "Standard ceiling fan install / replace, wiring ready.",
      price: 249,
      durationMins: 45,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    elec_switch_board: {
      id: "elec_switch_board",
      name: "Switch / Socket Repair",
      description: "Switch, socket, regulator, holder repair / replacement.",
      price: 149,
      durationMins: 30,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    elec_mcb: {
      id: "elec_mcb",
      name: "MCB / DB Troubleshooting",
      description: "Short-circuit, overload, MCB / DB related faults.",
      price: 299,
      durationMins: 60,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    elec_light_install: {
      id: "elec_light_install",
      name: "Light / Tube / Panel Installation",
      description: "Tube-light, LED panel, chandelier basic fitting.",
      price: 199,
      durationMins: 45,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    elec_inspection: {
      id: "elec_inspection",
      name: "Electrician Visit (Inspection)",
      description: "General electrical issue check-up. Work extra as per estimate.",
      price: 199,
      durationMins: 45,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
  };

  // Don’t delete existing plumber / carpenter data – only merge / overwrite AC + Elec
  await adminDb.ref("subServices/svc_ac").update(acSub);
  await adminDb.ref("subServices/svc_elec").update(elecSub);

  return {
    message: "Seeded AC + Electrician services & sub-services.",
    servicesSeeded: Object.keys(servicesUpdates),
    acSubCount: Object.keys(acSub).length,
    elecSubCount: Object.keys(elecSub).length,
  };
}

// Allow BOTH GET and POST so browser se bhi ho jaaye
export async function GET() {
  try {
    const result = await runSeed();
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    console.error("SEED GET ERR", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Seed failed" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await runSeed();
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    console.error("SEED POST ERR", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Seed failed" },
      { status: 500 }
    );
  }
}
    