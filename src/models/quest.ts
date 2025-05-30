import mongoose, { Document, Schema } from "mongoose";

const questSchema = new Schema(
    {
        className: { type: String },
        title: { type: String },
        imageUrl: { type: String },
        description: { type: String },
        creatorId: { type: String },
        data: { type: Object, default: {} },
    },
    { timestamps: true },
);

export interface QuestDocument extends Document {
    className: string;
    title: string;
    imageUrl: string;
    description: string;
    creatorId: string;
    data: Record<string, any>;
}

export const QuestModel = mongoose.model<QuestDocument>("Quest", questSchema);
