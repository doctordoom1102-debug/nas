import mongoose, { Schema, Document } from "mongoose";

export interface INews extends Document {
    title: string;
    content: string;
    isActive: boolean;
    priority: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NewsSchema = new Schema<INews>({
    title: { type: String, required: true },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

if (process.env.NODE_ENV !== "production") {
    delete (mongoose.models as any).News;
}

export const News =
    mongoose.models.News || mongoose.model<INews>("News", NewsSchema);
