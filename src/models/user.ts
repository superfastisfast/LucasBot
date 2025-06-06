import { TextChannel, User, type PartialUser } from "discord.js";
import mongoose, { Document, Schema } from "mongoose";
import { client } from "..";

const userSchema = new Schema(
    {
        id: { type: String },
        username: { type: String },
        timeouts: { type: Number, default: 0.0 },
        level: { type: Number, default: 0 },
        xp: { type: Number, default: 0.0 },
        lastXpMessageAt: { type: Schema.Types.Date, default: Date.now },
        gold: { type: Number, default: 0.0 },
        skillPoints: { type: Number, default: 0.0 },
        Weapon: { type: String, default: "Fists" },
        Helmet: { type: String, default: "none" },
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
    level: number;
    xp: number;
    lastXpMessageAt: Date;
    gold: number;
    skillPoints: number;
    Weapon: string;
    Helmet: string;
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
    export async function getIDFromUser(
        user: User | PartialUser | string,
    ): Promise<string> {
        if (typeof user === "object" && user !== null && "id" in user) {
            return String(user.id);
        }
        return user;
    }

    export async function getUser(
        user: User | PartialUser | string,
    ): Promise<User> {
        const id = await getIDFromUser(user);
        return client.users.fetch(id);
    }

    export async function getDBUserFromUser(
        user: User | PartialUser | string,
    ): Promise<UserDocument> {
        const id = await getIDFromUser(user);

        try {
            const user = await UserModel.findOne({ id: id });
            return user!;
        } catch (err) {
            throw new Error(`Failed to fetch user with ID ${id}: ${err}`);
        }
    }

    export async function giveXP(
        user: User | PartialUser | string,
        xp: number,
    ) {
        let dbUser = await getDBUserFromUser(user);

        await setXP(user, dbUser.xp + xp);
        await dbUser.save();
        return xp;
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

    export async function giveGold(
        user: User | PartialUser | string,
        amount: number,
    ) {
        let dbUser = await getDBUserFromUser(user);

        await setGold(user, dbUser.gold + amount);
        await dbUser.save();
        return amount;
    }

    export async function setGold(
        user: User | PartialUser | string,
        amount: number,
    ) {
        let dbUser = await getDBUserFromUser(user);

        dbUser.gold = Math.max(-1000, amount);
        await dbUser.save();
        return amount;
    }
}

/// This is depricated shit that only exits because of old code???!!?!???!?!?!
export async function getUserFromId(id: string): Promise<User> {
    // Should fix
    return await DataBase.getUser(id);
}

export async function level(
    user: User | PartialUser | string,
    xp: number,
): Promise<void> {
    if (user === client.user) return;
    const dbUser = await DataBase.getDBUserFromUser(user);

    if (!process.env.QUEST_CHANNEL_ID)
        throw new Error("QUEST_CHANNEL_ID is not defined in .env");
    const levelChannel = (await client.channels.fetch(
        process.env.QUEST_CHANNEL_ID,
    )) as TextChannel;

    const level = calculateLevel(xp);

    if (level > dbUser.level) {
        dbUser.level = level;
        await dbUser.save();
        await levelChannel.send(
            `${await DataBase.getUser(user)} is now level ${level}!`,
        );
    }

    if (level < dbUser.level) {
        dbUser.level = level;
        await dbUser.save();
        await levelChannel.send(
            `${await DataBase.getUser(user)} is now level ${level}!`,
        );
    }
}

const xpThresholds: number[] = [
    //  XP           Level
    0, //     0
    1, //     1
    50, //     2
    100, //     3
    250, //     4
    500, //     5
    1000, //     6
    1750, //     7
    2750, //     8
    4000, //     9
    5000, //    10
    7500, //    11
    9500, //    12
    10250, //    13
    15250, //    14
    20000, //    15
];

function calculateLevel(xp: number): number {
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
        if (xp >= xpThresholds[i]!) {
            return i;
        }
    }
    return 0;
}
