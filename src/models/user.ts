import mongoose, { Document, Schema } from "mongoose";

const userSchema = new Schema(
    {
        id: { type: String },
        username: { type: String },
        xp: { type: Number, default: 0.0 },
        lastXpMessageAt: { type: Schema.Types.Date, default: Date.now },
        balance: { type: Number, default: 0.0 },
    },
    { timestamps: true },
);

export interface UserDocument extends Document {
    id: string;
    username: string;
    xp: number;
    lastXpMessageAt: Date;
    balance: number;
}

export const UserModel = mongoose.model<UserDocument>("User", userSchema);

export async function giveXP(userID: string, xp: number) {
    let dbUser = await UserModel.findOne({ id: userID });
    if (!dbUser) {
        return;
    }

    dbUser.xp = Math.max(-100, dbUser.xp + xp);
    await dbUser.save();
}
