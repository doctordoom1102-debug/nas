import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Booking } from "@/lib/models/Booking";
import { getSession } from "@/lib/auth";

// POST — desktop app sends booking screenshot + details (no auth needed, uses license key)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { licenseKey, hwid, details, screenshot, formName, formTitle } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { error: "licenseKey is required" },
        { status: 400 }
      );
    }

    if (!screenshot && !details) {
      return NextResponse.json(
        { error: "screenshot or details required" },
        { status: 400 }
      );
    }

    const booking = await Booking.create({
      licenseKey: licenseKey || "",
      hwid: hwid || "",
      details: details || "",
      screenshot: screenshot || "",
      formName: formName || "",
      formTitle: formTitle || "",
    });

    return NextResponse.json({
      success: true,
      id: booking._id,
      message: "Booking recorded",
    });
  } catch (err: any) {
    console.error("Booking POST error:", err);
    return NextResponse.json(
      { error: "Failed to save booking" },
      { status: 500 }
    );
  }
}

// GET — admin panel fetches all bookings
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { licenseKey: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
        { formTitle: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-screenshot") // Don't send base64 in list view
      .lean();

    return NextResponse.json({
      bookings,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("Booking GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
