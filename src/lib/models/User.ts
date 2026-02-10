import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "master_admin" | "admin" | "super" | "seller";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string; // bcrypt hash
  role: UserRole;
  createdBy: mongoose.Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["master_admin", "admin", "super", "seller"],
    required: true,
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null },
});

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// Role hierarchy: who can create whom
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  master_admin: ["admin", "super", "seller"],
  admin: ["super", "seller"],
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
    "create_keys", "view_logs",
  ],
};

export function canManageRole(myRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[myRole]?.includes(targetRole) || false;
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}
