import mongoose, { Schema, Document } from "mongoose";

export interface IIrctcToken extends Document {
  clientID: string;
  token: string; // plain "6,a..." sensor string
  createdAt: Date;
}

const IrctcTokenSchema = new Schema<IIrctcToken>({
  clientID: { type: String, required: true, index: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const IrctcToken =
  mongoose.models.IrctcToken ||
  mongoose.model<IIrctcToken>("IrctcToken", IrctcTokenSchema);
