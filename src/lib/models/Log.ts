import mongoose, { Schema, Document } from "mongoose";

export interface ILog extends Document {
  licenseKey: string;
  action: string;
  ip: string;
  hwid: string;
  details: string;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>({
  licenseKey: { type: String, required: true, index: true },
  action: { type: String, required: true },
  ip: { type: String, default: "" },
  hwid: { type: String, default: "" },
  details: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export const Log = mongoose.models.Log || mongoose.model<ILog>("Log", LogSchema);
