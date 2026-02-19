import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ authenticated: false }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.userId).select("username email role paymentDue dueSince isLocked").lean();

  let isLocked = false;
  let lockMessage = "";

  // Grace period helper: returns true if lock threshold has been reached
  function shouldLock(paymentDue: number, dueSince: Date | null, role: string): boolean {
    if (paymentDue <= 0) return false;
    if (!dueSince) return false; // No dueSince means due was just created, not yet lockable

    const now = new Date();
    const dueDate = new Date(dueSince);
    // Calculate calendar days difference (based on midnight boundary)
    const startOfDueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysDiff = Math.floor((startOfToday.getTime() - startOfDueDay.getTime()) / 86400000);

    if (role === "seller" && daysDiff >= 1) return true;   // Seller: lock after 1 day
    if (role === "super" && daysDiff >= 2) return true;    // Super: lock after 2 days
    if (role === "admin" && daysDiff >= 4) return true;    // Admin: lock after 4 days
    return false;
  }

  // Recursive Parent Lock Check: deactivation + grace period dues
  let currentId: any = session.userId;
  while (currentId) {
    const parent = await User.findById(currentId).select("_id paymentDue dueSince role createdBy username isActive").lean();
    if (!parent || parent.role === "master_admin") break;

    // Check 1: Is this user or parent DEACTIVATED?
    if (parent.isActive === false) {
      isLocked = true;
      const isSelf = parent._id.toString() === session.userId;
      if (isSelf) {
        lockMessage = "Your account has been deactivated. Please contact your admin.";
      } else {
        const isAdmin = parent.role === "admin";
        lockMessage = `ACCESS DENIED! Your ${isAdmin ? "Mini Admin" : "Super Seller"} (${parent.username}) has been deactivated. All sub-panels are locked.`;
      }
      break;
    }

    // Check 2: Is this user past their grace period for dues?
    if (shouldLock(parent.paymentDue, parent.dueSince, parent.role)) {
      isLocked = true;
      const isSelf = parent._id.toString() === session.userId;
      const isAdmin = parent.role === "admin";

      if (isSelf) {
        if (parent.role === "seller") {
          lockMessage = "Your panel is locked due to unpaid balance. Sellers must clear dues within 1 day.";
        } else if (parent.role === "super") {
          lockMessage = "Your panel is locked due to unpaid balance. Super Sellers must clear dues within 2 days.";
        } else if (parent.role === "admin") {
          lockMessage = "Your panel is locked due to unpaid balance. Admins must clear dues within 4 days.";
        }
      } else {
        lockMessage = `ACCESS DENIED! Your ${isAdmin ? "Mini Admin" : "Super Seller"} (${parent.username}) has outstanding dues. All sub-panels are temporarily locked.`;
      }
      break;
    }
    currentId = parent.createdBy;
  }

  // Auto-update database status for consistency
  if (isLocked && !user?.isLocked) {
    await User.findByIdAndUpdate(session.userId, { isLocked: true });
  } else if (!isLocked && user?.isLocked) {
    await User.findByIdAndUpdate(session.userId, { isLocked: false });
  }

  return NextResponse.json({
    authenticated: true,
    userId: session.userId,
    username: user?.username || session.username,
    email: user?.email || session.email,
    role: user?.role || session.role,
    paymentDue: user?.paymentDue || 0,
    isLocked,
    lockMessage
  });
}
