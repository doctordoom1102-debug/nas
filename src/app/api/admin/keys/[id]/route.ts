import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { Log } from "@/lib/models/Log";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/models/User";

// GET — single key details + logs
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const license = await License.findById(params.id)
    .populate("createdBy", "username role")
    .populate("approvedBy", "username role")
    .lean();
  if (!license)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logs = await Log.find({ licenseKey: (license as any).key })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ license, logs });
}

// PUT — update key (approve, ban, reset HWID, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const updates = await req.json();
  const allowed: any = {};

  // Approve key (pending -> active) — requires approve_keys permission
  if (updates.status === "active" || updates.approve) {
    if (!hasPermission(session.role, "approve_keys")) {
      return NextResponse.json(
        { error: "You don't have permission to approve keys" },
        { status: 403 }
      );
    }
    allowed.status = "active";
    allowed.approvedBy = session.userId;
  } else if (updates.status === "banned") {
    if (!hasPermission(session.role, "ban_keys")) {
      return NextResponse.json(
        { error: "You don't have permission to ban keys" },
        { status: 403 }
      );
    }
    allowed.status = "banned";
  } else if (updates.status) {
    allowed.status = updates.status;
  }

  if (updates.tier) allowed.tier = updates.tier;
  if (updates.notes !== undefined) allowed.notes = updates.notes;
  if (updates.expiresAt !== undefined)
    allowed.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;

  // HWID reset (MAC reset)
  if (updates.resetHwid) {
    if (!hasPermission(session.role, "reset_hwid")) {
      return NextResponse.json(
        { error: "You don't have permission to reset HWID" },
        { status: 403 }
      );
    }
    const license = await License.findById(params.id);
    if (!license) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Enforce max resets limit (master_admin bypasses limit)
    const resetsUsed = license.hwidResetsUsed || 0;
    const maxResets = license.maxHwidResets || 3;
    if (resetsUsed >= maxResets && session.role !== "master_admin") {
      return NextResponse.json(
        { error: `Max HWID resets reached (${resetsUsed}/${maxResets}). Only Master Admin can override.` },
        { status: 403 }
      );
    }
    allowed.hwid = null;
    allowed.hwidResetsUsed = resetsUsed + 1;
    await Log.create({
      licenseKey: license.key,
      action: "hwid_reset",
      details: `Reset by ${session.username} (${session.role}). Resets: ${resetsUsed + 1}/${maxResets}`,
      ip: "",
      hwid: license.hwid || "",
    });
  }

  const license = await License.findByIdAndUpdate(params.id, allowed, {
    new: true,
  }).lean();
  if (!license)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, license });
}

// DELETE — delete key
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasPermission(session.role, "delete_keys")) {
    return NextResponse.json(
      { error: "You don't have permission to delete keys" },
      { status: 403 }
    );
  }

  await connectDB();
  const license = await License.findByIdAndDelete(params.id);
  if (!license)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
