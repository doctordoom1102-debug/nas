import mongoose, { Schema, Document } from "mongoose";

export interface ILog extends Document {
  licenseKey: string;
  action: string;
  ip: string;
  hwid: string;
  details: string;
  performedBy: mongoose.Types.ObjectId | null;
  targetUser: mongoose.Types.ObjectId | null;
  amount: number;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>({
  licenseKey: { type: String, index: true },
  action: { type: String, required: true },
  ip: { type: String, default: "" },
  hwid: { type: String, default: "" },
  details: { type: String, default: "" },
  performedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  targetUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
  amount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Force delete the model if it exists to ensure schema updates are applied in development
if (mongoose.models.Log) {
  delete mongoose.models.Log;
}

export const Log = mongoose.model<ILog>("Log", LogSchema);
