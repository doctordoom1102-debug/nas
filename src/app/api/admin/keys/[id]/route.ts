import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { Log } from "@/lib/models/Log";
import { getSession } from "@/lib/auth";
import { User, hasPermission } from "@/lib/models/User";

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

  // Approve/Pay key logic — strictly triggers only via updates.approve
  if (updates.approve) {
    if (!hasPermission(session.role, "approve_keys")) {
      return NextResponse.json(
        { error: "You don't have permission to approve keys" },
        { status: 403 }
      );
    }
    allowed.approvedBy = session.userId;
    allowed.status = "active"; // Automatically activate the key when paid

    const license = await License.findById(params.id);
    if (license) {
      // Ensure the key has at least 30 days validity from now upon payment
      const now = new Date();
      const minExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const currentExpiry = license.expiresAt ? new Date(license.expiresAt) : new Date(0);

      // If current validity is less than 30 days, bump it to 30 days
      if (currentExpiry < minExpiry) {
        allowed.expiresAt = minExpiry;
      }

      // Log the approval/payment
      await Log.create({
        licenseKey: license.key,
        action: "key_paid",
        details: `Key marked as PAID by ${session.username}. ${allowed.expiresAt ? `Validity ensured to 30 days (${allowed.expiresAt.toLocaleDateString()})` : "Validity maintained."}`,
        ip: "",
        hwid: license.hwid || "",
        performedBy: session.userId,
        amount: 2400,
      });

      // Hierarchical Debt Cascade: Update stats for the creator and debt for everyone in the parent chain
      let currentId: any = license.createdBy;
      let isFirst = true;

      while (currentId) {
        const u = await User.findById(currentId);
        if (!u || u.role === "master_admin") break;

        let price = 2400;
        if (u.role === "super") price = 2200;
        if (u.role === "admin") price = 2000;

        const updateData: any = { $inc: { paymentDue: price } };

        // Only the actual creator gets the 'Paid' count and 'Unpaid' reduction
        if (isFirst) {
          updateData.$inc.todayPaid = 1;
          updateData.$inc.totalPaid = 1;
          updateData.$inc.totalUnpaid = -1;
          isFirst = false;
        }

        await User.findByIdAndUpdate(currentId, updateData);
        currentId = u.createdBy;
      }
    }
  } else if (updates.status === "banned") {
    if (!hasPermission(session.role, "ban_keys")) {
      return NextResponse.json(
        { error: "You don't have permission to ban keys" },
        { status: 403 }
      );
    }
    allowed.status = "banned";
  } else if (updates.status === "active") {
    // Basic activation (e.g. unbanning) doesn't require "approve_keys" if it was already approved
    // or if the user has permission to manage keys.
    allowed.status = "active";
  } else if (updates.status) {
    allowed.status = updates.status;
  }

  if (updates.tier) allowed.tier = updates.tier;
  if (updates.notes !== undefined) allowed.notes = updates.notes;
  if (updates.expiresAt !== undefined)
    allowed.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;

  // Renew key logic (Requests renewal + Adds time immediately)
  if (updates.renew) {
    const license = await License.findById(params.id);
    if (!license) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Logic: New Validity = Max(now, current_expiry) + 30 days
    const now = new Date();
    const currentExpire = (license.expiresAt && license.expiresAt > now)
      ? new Date(license.expiresAt)
      : now;
    allowed.expiresAt = new Date(currentExpire.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Reset payment status to unpaid
    allowed.approvedBy = null;
    allowed.status = "active";

    await Log.create({
      licenseKey: license.key,
      action: "renew_request",
      details: `Renewal requested by ${session.username}. 30 days added. Key is now unpaid. New expiry: ${allowed.expiresAt.toLocaleDateString()}`,
      ip: "",
      hwid: license.hwid || "",
      performedBy: session.userId
    });

    // Increment totalUnpaid for the actual creator record.
    // Debt (paymentDue) will be added later when the renewal is "Approved/Paid".
    await User.findByIdAndUpdate(license.createdBy, {
      $inc: { totalUnpaid: 1 }
    });
  }

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
