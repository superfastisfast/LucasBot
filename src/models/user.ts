import type { User } from "discord.js";
import mongoose, { Document, Schema } from "mongoose";
import { client } from "..";

const userSchema = new Schema(
    {
        id: { type: String },
        username: { type: String },
        timeouts: { type: Number, default: 0.0 },
        xp: { type: Number, default: 0.0 },
        lastXpMessageAt: { type: Schema.Types.Date, default: Date.now },
        balance: { type: Number, default: 0.0 },
        skillPoints: { type: Number, default: 0.0 },
        strength: { type: Number, default: 0.0 },
        agility: { type: Number, default: 0.0 },
        charisma: { type: Number, default: 0.0 },
        magicka: { type: Number, default: 0.0 },
        stamina: { type: Number, default: 0.0 },
        defense: { type: Number, default: 0.0 },
        currentHealth: { type: Number, default: 0.0 },
        maxHealth: { type: Number, default: 0.0 },
        currentArmor: { type: Number, default: 0.0 },
        maxArmor: { type: Number, default: 0.0 },
    },
    { timestamps: true },
);

export interface UserDocument extends Document {
    id: string;
    username: string;
    timeouts: number;
    xp: number;
    lastXpMessageAt: Date;
    balance: number;
    skillPoints: number;
    strength: number;
    agility: number;
    charisma: number;
    magicka: number;
    stamina: number;
    defense: number;
    currentHealth: number;
    maxHealth: number;
    currentArmor: number;
    maxArmor: number;
}

export type UserModel = mongoose.InferSchemaType<typeof userSchema>;
export const UserModel = mongoose.model<UserDocument>("User", userSchema);

export async function getUserFromId(id: string): Promise<User> {
    return await client.users.fetch(id);
}

export async function getIdFromUser(user: User | string): Promise<string> {
    if (typeof user === "object" && user !== null && "id" in user) {
        return user.id;
    }
    return user;
}

export async function giveXP(user: User | string, xp: number) {
    const id = getIdFromUser(user);
    let dbUser = await UserModel.findOne({ id: id });
    if (!dbUser) {
        return;
    }
    console.log("xp: " + xp);
    if (xp > 0 && dbUser.timeouts > 0) {
        const maxTimeoutsForReduction = 20;
        const minTimeoutsForReduction = 1;
        let reductionFactor =
            (dbUser.timeouts - minTimeoutsForReduction) /
            (maxTimeoutsForReduction - minTimeoutsForReduction);
        reductionFactor = Math.max(0, Math.min(1, reductionFactor));
        xp = xp * (1 - reductionFactor);
    }
    console.log("new xp: " + xp);

    dbUser.xp = Math.max(-100, dbUser.xp + xp);
    await dbUser.save();
    return xp;
}
