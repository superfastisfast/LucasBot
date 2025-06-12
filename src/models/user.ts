import mongoose, { Document, Schema } from "mongoose";

const InventorySchema = new Schema(
    {
        gold: { type: Number, default: 0.0 },
        weapon: { type: String, default: "none" },
        helmet: { type: String, default: "none" },
        chestplate: { type: String, default: "none" },
        leggings: { type: String, default: "none" },
        boots: { type: String, default: "none" },
        shield: { type: String, default: "none" },
    },
    { _id: false },
);

const StatsSchema = new Schema(
    {
        strength: { type: Number, default: 3.0 },
        agility: { type: Number, default: 10.0 },
        charisma: { type: Number, default: 1.0 },
        magicka: { type: Number, default: 1.0 },
        stamina: { type: Number, default: 3.0 },
        defense: { type: Number, default: 3.0 },
        vitality: { type: Number, default: 1.0 },
    },
    { _id: false },
);

const userSchema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        username: { type: String, required: true },
        timeouts: { type: Number, default: 0.0 },
        level: { type: Number, default: 0 },
        xp: { type: Number, default: 0.0 },
        lastXpMessageAt: { type: Date, default: Date.now },
        skillPoints: { type: Number, default: 0.0 },
        inventory: {
            type: InventorySchema,
            default: () => ({
                gold: 0.0,
                weapon: "none",
                helmet: "none",
                chestplate: "none",
            }),
        },
        stats: {
            type: StatsSchema,
            default: () => ({
                strength: 3.0,
                agility: 10.0,
                charisma: 1.0,
                magicka: 1.0,
                stamina: 3.0,
                defense: 3.0,
                vitality: 1.0,
            }),
        },
        portalsEntered: { type: Number, default: 0.0 },
    },
    { timestamps: true },
);

export interface IInventory extends Document {
    gold: number;
    weapon: string;
    helmet: string;
    chestplate: string;
    leggings: string;
    boots: string;
    shield: string;
}

export interface IStats extends Document {
    strength: number;
    agility: number;
    charisma: number;
    magicka: number;
    stamina: number;
    defense: number;
    vitality: number;
}

export interface UserDocument extends Document {
    id: string;
    username: string;
    timeouts: number;
    level: number;
    xp: number;
    lastXpMessageAt: Date;
    skillPoints: number;
    inventory: IInventory;
    stats: IStats;
    portalsEntered: number;
    createdAt: Date;
    updatedAt: Date;
}

export type StatsModel = mongoose.InferSchemaType<typeof StatsSchema>;
export const StatsModel = mongoose.model<IStats>("Stats", StatsSchema);

export type UserModel = mongoose.InferSchemaType<typeof userSchema>;
export const UserModel = mongoose.model<UserDocument>("User", userSchema);
