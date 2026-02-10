import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { Log } from "@/lib/models/Log";

/**
 * POST /api/license/validate
 * Called by the NASA desktop client to validate a license key.
 * Returns a compatible JSON response so the app works seamlessly.
 *
 * Request body: { key: string, hwid: string }
 * Response: JSON with success, leftDays, edata, pass, etc.
 */

// The golden edata and pass from the captured anonymous key.
// These are required for the app's internal features and DB encryption.
const GOLDEN_EDATA =
  "WCVEKDoQVlQY0BX1fnaQMtwzeCztUc22wQXWKQeBqDthcbPRO6I4E6/oT8VJ3csWjCqbWpIry8jw/pMIbvDnjrQ38B2NGTIw9XMXI1XVaOp49hx22FH/nvILeMYBrclyENvTkl1v7ImN13e+lZIbs3pUxzUD7WD9eCkFWXxHYhvzxaFQAENIZsBDebMlgaj+";
const GOLDEN_PASS = "8vyzBWQ4"; // ramjiself1's pass - matches existing DB encryption
const GOLDEN_BATCHNO = "xCOucxfvWA76P90t9Sy+9w==";
const APP_VERSION = "2025.0.5.7||h#67nhgdft||ON||ON||2022.0.6.9";
const SHORT_MESSAGE =
  "Welcome to NASA Control@@All systems are go@@Contact your seller for support@@Launch authorized!";

function makeSuccessResponse(daysLeft: number, keyName: string) {
  return {
    success: true,
    message: null,
    leftDays: daysLeft,
    appVersion: APP_VERSION,
    ipList: null,
    ShortMessage: SHORT_MESSAGE,
    KeyType: "monthly",
    paid: "Paid",
    SellerId: "NASA",
    edata: GOLDEN_EDATA,
    sdata: "0",
    adata: "0",
    SuperSeller: "NASA",
    Admin: "NASA",
    pass: GOLDEN_PASS,
    BatchNo: GOLDEN_BATCHNO,
  };
}

function makeFailResponse(message: string) {
  return {
    success: false,
    message: message,
    leftDays: 0,
    appVersion: APP_VERSION,
    ipList: null,
    ShortMessage: "",
    KeyType: "",
    paid: "",
    SellerId: "",
    edata: "",
    sdata: "0",
    adata: "0",
    SuperSeller: "",
    Admin: "",
    pass: "",
    BatchNo: "",
  };
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const key = body.key || body.licenseKey || "";
    const hwid = body.hwid || body.mac || "";
    const ip = getIp(req);

    if (!key) {
      return NextResponse.json(makeFailResponse("No key provided"));
    }

    const license = await License.findOne({ key });
    if (!license) {
      await Log.create({
        licenseKey: key,
        action: "validate_invalid",
        hwid,
        ip,
        details: "Key not found",
      });
      return NextResponse.json(makeFailResponse("Invalid license key"));
    }

    // Check status
    if (license.status === "banned") {
      await Log.create({
        licenseKey: key,
        action: "validate_banned",
        hwid,
        ip,
      });
      return NextResponse.json(makeFailResponse("This key has been banned"));
    }

    if (license.status === "pending") {
      return NextResponse.json(
        makeFailResponse("This key is pending approval. Contact your seller.")
      );
    }

    if (license.status === "inactive") {
      return NextResponse.json(
        makeFailResponse("This key is inactive")
      );
    }

    // Check expiry
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      license.status = "expired";
      await license.save();
      await Log.create({
        licenseKey: key,
        action: "validate_expired",
        hwid,
        ip,
      });
      return NextResponse.json(makeFailResponse("This key has expired"));
    }

    // HWID (MAC) binding — prevent multiple devices
    if (hwid) {
      if (!license.hwid) {
        // First activation — bind to this device
        license.hwid = hwid;
        await Log.create({
          licenseKey: key,
          action: "hwid_bound",
          hwid,
          ip,
          details: "First activation",
        });
      } else if (license.hwid !== hwid) {
        // Different device — block
        await Log.create({
          licenseKey: key,
          action: "hwid_mismatch",
          hwid,
          ip,
          details: `Bound to ${license.hwid}, attempted from ${hwid}`,
        });
        return NextResponse.json(
          makeFailResponse(
            "This key is bound to another device. Contact admin for MAC reset."
          )
        );
      }
    }

    // Calculate days left
    let daysLeft = 999;
    if (license.expiresAt) {
      const msLeft =
        new Date(license.expiresAt).getTime() - Date.now();
      daysLeft = Math.max(1, Math.ceil(msLeft / 86400000));
    }

    // Update usage
    license.lastUsedAt = new Date();
    license.lastUsedIp = ip;
    await license.save();

    await Log.create({
      licenseKey: key,
      action: "validate_success",
      hwid,
      ip,
    });

    return NextResponse.json(makeSuccessResponse(daysLeft, key));
  } catch (err: any) {
    console.error("Validate error:", err);
    return NextResponse.json(makeFailResponse("Server error"));
  }
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
