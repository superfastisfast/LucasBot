import {
    User,
    type PartialUser
} from "discord.js";
import mongoose, { Document, Schema } from "mongoose";


const userSchema = new Schema(
    {
        id: { type: String },
        username: { type: String },
        timeouts: { type: Number, default: 0.0 },
        xp: { type: Number, default: 0.0 },
        lastXpMessageAt: { type: Schema.Types.Date, default: Date.now },
        balance: { type: Number, default: 0.0 },
        skillPoints: { type: Number, default: 0.0 },
        Weapon: { type: String, default: "Fists" },
        strength: { type: Number, default: 3.0 },
        agility: { type: Number, default: 10.0 },
        charisma: { type: Number, default: 0.0 },
        magicka: { type: Number, default: 0.0 },
        stamina: { type: Number, default: 3.0 },
        defense: { type: Number, default: 3.0 },
        vitality: { type: Number, default: 1.0 },
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
    Weapon: string;
    strength: number;
    agility: number;
    charisma: number;
    magicka: number;
    stamina: number;
    defense: number;
    vitality: number;
}

export type UserModel = mongoose.InferSchemaType<typeof userSchema>;
export const UserModel = mongoose.model<UserDocument>("User", userSchema);

export namespace DataBase {
    export async function getIDFromUser(user: User | PartialUser | string): Promise<string> {
        if (typeof user === "object" && user !== null && "id" in user) {
            return String(user.id);
        }
        return user;
    }

    export async function getDBUserFromUser(user: User | PartialUser | string): Promise<UserDocument> {
        const id = await getIDFromUser(user);
        
        try {    
            const user = await UserModel.findOne({ id: id });
            return user!;
        } catch (err) {
            throw new Error(`Failed to fetch user with ID ${id}: ${err}`);
        }
    }


    export async function giveXP(user: User | PartialUser | string, xp: number) {
        let dbUser = await getDBUserFromUser(user);

        await setXP(user, dbUser.xp + xp);
        await dbUser.save();
        return xp;
    }

    export async function getXP(user: User | PartialUser | string, xp: number) {
        let dbUser = await getDBUserFromUser(user)

        return dbUser.xp
    }

    export async function setXP(user: User | PartialUser | string, xp: number) {
        let dbUser = await getDBUserFromUser(user);

        if (xp > 0 && dbUser.timeouts > 0) {
            const maxTimeoutsForReduction = 20;
            const minTimeoutsForReduction = 1;
            let reductionFactor =
                (dbUser.timeouts - minTimeoutsForReduction) /
                (maxTimeoutsForReduction - minTimeoutsForReduction);
            reductionFactor = Math.max(0, Math.min(1, reductionFactor));
            xp = xp * (1 - reductionFactor);
        }

        await level(user, xp);
        dbUser.xp = Math.max(-100, xp);
        await dbUser.save();
        return xp;
    }

    export async function giveGold(user: User | PartialUser | string, amount: number) {
        let dbUser = await getDBUserFromUser(user);

        dbUser.balance = Math.max(-1000, dbUser.balance + amount);
        await dbUser.save();
        return amount;
    }

    export async function getGold(user: User | PartialUser | string, gold: number) {
        let dbUser = await getDBUserFromUser(user)

        return dbUser.balance
    }

    export async function setGold(user: User | PartialUser | string, amount: number) {
        let dbUser = await getDBUserFromUser(user);

        dbUser.balance = Math.max(-1000, amount);
        await dbUser.save();
        return amount;
    }
}

async function level(user: User | PartialUser | string, newXp: number): Promise<number> {
    let dbUser = await DataBase.getDBUserFromUser(user);
    const oldXp = dbUser.xp;

    (async () => {
        let dbUser = await DataBase.getDBUserFromUser(user);

        let level: number = 0;
        await calculateLevel(newXp);

        const currentLevel;

        if (oldXp + newXp >= 100 && oldXp <= newXp) {}

        return level;
    })();
    
    return 0;
}

async function calculateLevel(xp: number): Promise<number> {
    return Math.floor(xp / 10);
}

async function requiredXPForNextLevel(level: number): Promise<number> {
    return 0;
}