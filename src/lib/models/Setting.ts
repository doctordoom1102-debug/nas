import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
    key: string;
    value: string;
    updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>({
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
});

export const Setting =
    mongoose.models.Setting ||
    mongoose.model<ISetting>("Setting", SettingSchema);
