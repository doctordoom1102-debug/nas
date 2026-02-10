import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  licenseKey: string;
  hwid: string;
  details: string;
  screenshot: string; // base64 PNG
  formName: string;
  formTitle: string;
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  licenseKey: { type: String, required: true, index: true },
  hwid: { type: String, default: "" },
  details: { type: String, default: "" },
  screenshot: { type: String, default: "" },
  formName: { type: String, default: "" },
  formTitle: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

BookingSchema.index({ createdAt: -1 });

export const Booking =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
