import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { getSession } from "@/lib/auth";
import { User, hasPermission } from "@/lib/models/User";
import { generateBulkKeys } from "@/lib/keygen";

// GET — list all keys
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tier = searchParams.get("tier");
  const search = searchParams.get("search");
  const createdByParam = searchParams.get("createdBy");

  const filter: any = {};
  if (status) filter.status = status;
  if (tier) filter.tier = tier;
  if (search) filter.key = { $regex: search, $options: "i" };

  // Sellers can only see keys they created
  if (session.role === "seller") {
    filter.createdBy = session.userId;
  } else if (createdByParam && ["master_admin", "admin", "super"].includes(session.role)) {
    // Hierarchical key view: Find all keys created by this user AND their sub-sellers
    let creatorIds = [createdByParam];

    // Find one level deep (e.g., if super selected, find its sellers)
    const level1 = await User.find({ createdBy: createdByParam }).select("_id").lean();
    if (level1.length > 0) {
      const level1Ids = level1.map(u => u._id.toString());
      creatorIds.push(...level1Ids);

      // Find two levels deep (e.g., if admin selected, find its super sellers' sub-sellers)
      const level2 = await User.find({ createdBy: { $in: level1Ids } }).select("_id").lean();
      if (level2.length > 0) {
        const level2Ids = level2.map(u => u._id.toString());
        creatorIds.push(...level2Ids);

        // Find three levels deep (master admin case)
        const level3 = await User.find({ createdBy: { $in: level2Ids } }).select("_id").lean();
        if (level3.length > 0) {
          const level3Ids = level3.map(u => u._id.toString());
          creatorIds.push(...level3Ids);
        }
      }
    }

    filter.createdBy = { $in: creatorIds };
  }

  const keys = await License.find(filter)
    .populate("createdBy", "username role")
    .populate("approvedBy", "username role")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  const total = await License.countDocuments(filter);

  return NextResponse.json({ keys, total });
}

// POST — generate keys
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasPermission(session.role, "create_keys")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { count = 1, tier = "basic", expiresInDays, notes = "", customKey } = await req.json();

  const num = Math.min(Math.max(1, count), 100);
  let keys: string[] = [];

  const nameForKey = (customKey || notes || "").trim();
  if (nameForKey) {
    const keyVal = nameForKey;
    if (num === 1) {
      const exists = await License.findOne({ key: keyVal });
      if (exists) {
        return NextResponse.json(
          { error: `Key "${keyVal}" already exists. Choose a different name.` },
          { status: 409 }
        );
      }
      keys = [keyVal];
    } else {
      for (let i = 0; i < num; i++) {
        const candidate = `${keyVal}-${String(i + 1).padStart(2, "0")}`;
        const exists = await License.findOne({ key: candidate });
        if (exists) {
          return NextResponse.json(
            { error: `Key "${candidate}" already exists.` },
            { status: 409 }
          );
        }
        keys.push(candidate);
      }
    }
  } else {
    keys = generateBulkKeys(num);
  }
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

  // Sellers create keys as "pending", others create as "active"
  const initialStatus = session.role === "seller" ? "pending" : "active";

  const docs = keys.map((key) => ({
    key,
    tier,
    expiresAt,
    notes,
    status: initialStatus,
    createdBy: session.userId,
    approvedBy: initialStatus === "active" ? session.userId : null,
  }));

  await License.insertMany(docs);

  // Price logic based on role
  let pricePerId = 0;
  if (session.role === "seller") pricePerId = 2400;
  else if (session.role === "super") pricePerId = 2200;
  else if (session.role === "admin") pricePerId = 2000;

  // Update creator counts
  await User.findByIdAndUpdate(session.userId, {
    $inc: {
      totalSold: keys.length,
      todaySold: keys.length,
      totalUnpaid: keys.length,
    }
  });

  if (initialStatus === "active") {
    // Hierarchical Debt Cascade: Update debt for everyone in the parent chain
    let currentId: any = session.userId;
    while (currentId) {
      const u = await User.findById(currentId);
      if (!u || u.role === "master_admin") break;

      let price = 2400;
      if (u.role === "super") price = 2200;
      if (u.role === "admin") price = 2000;

      const update: any = { $inc: { paymentDue: price * keys.length } };
      // If they didn't have a due date yet, set it now
      if (!u.dueSince) {
        update.$set = { dueSince: new Date() };
      }

      await User.findByIdAndUpdate(currentId, update);
      currentId = u.createdBy;
    }
  }

  return NextResponse.json({
    success: true,
    keys,
    count: keys.length,
    status: initialStatus,
  });
}
