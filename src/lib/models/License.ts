import mongoose, { Schema, Document } from "mongoose";

export interface ILicense extends Document {
  key: string;
  status: "active" | "inactive" | "expired" | "banned" | "pending";
  tier: "basic" | "pro" | "ultimate";
  hwid: string | null;
  maxHwidResets: number;
  hwidResetsUsed: number;
  expiresAt: Date | null;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId | null;
  approvedBy: mongoose.Types.ObjectId | null;
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  notes: string;
}

const LicenseSchema = new Schema<ILicense>({
  key: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ["active", "inactive", "expired", "banned", "pending"],
    default: "pending",
  },
  tier: { type: String, enum: ["basic", "pro", "ultimate"], default: "basic" },
  hwid: { type: String, default: null },
  maxHwidResets: { type: Number, default: 3 },
  hwidResetsUsed: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  lastUsedAt: { type: Date, default: null },
  lastUsedIp: { type: String, default: null },
  notes: { type: String, default: "" },
}, { timestamps: true });

export const License =
  mongoose.models.License ||
  mongoose.model<ILicense>("License", LicenseSchema);
