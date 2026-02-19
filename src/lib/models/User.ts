import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "master_admin" | "admin" | "super" | "seller";

export interface IUser extends Document {
  username: string;
  displayName: string;
  email: string;
  password: string; // bcrypt hash
  displayPassword?: string;
  role: UserRole;
  createdBy: mongoose.Types.ObjectId | null;
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  paymentDue: number;
  todaySold: number;
  activeSold: number;
  totalSold: number;
  todayPaid: number;
  totalPaid: number;
  totalUnpaid: number;
  dueSince: Date | null;
  isLocked: boolean;
  sellerCount?: number;
}


const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  displayPassword: { type: String, default: "" }, // For the "Password" column in the table
  role: {
    type: String,
    enum: ["master_admin", "admin", "super", "seller"],
    required: true,
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null },

  // Tracking fields for Dashboard/View Seller
  paymentDue: { type: Number, default: 0 },
  todaySold: { type: Number, default: 0 },
  activeSold: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  todayPaid: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  totalUnpaid: { type: Number, default: 0 },
  dueSince: { type: Date, default: null },
  isLocked: { type: Boolean, default: false },
});


// In development, handle schema changes by deleting the cached model
if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as any).User;
}

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// Strict Role Hierarchy: Each role creates exactly one level below
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  master_admin: ["admin"],
  admin: ["super"],
  super: ["seller"],
  seller: [],
};

// What each role can do
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  master_admin: [
    "manage_admins", "manage_supers", "manage_sellers",
    "create_keys", "approve_keys", "ban_keys", "delete_keys",
    "reset_hwid", "view_logs", "view_stats",
  ],
  admin: [
    "manage_supers", "manage_sellers",
    "create_keys", "approve_keys", "ban_keys", "delete_keys",
    "reset_hwid", "view_logs", "view_stats",
  ],
  super: [
    "manage_sellers",
    "create_keys", "approve_keys", "ban_keys",
    "reset_hwid", "view_logs", "view_stats",
  ],
  seller: [
    "create_keys", "view_logs", "reset_hwid",
  ],
};

export function canManageRole(myRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[myRole]?.includes(targetRole) || false;
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}
