import { TextChannel, User, type PartialUser } from "discord.js";
import mongoose, { Document, Schema } from "mongoose";
import { client } from "..";
import { Item, type ItemDocument } from "./item";

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
    createdAt: Date;
    updatedAt: Date;
}

type displayStatsFormat = [string, string, number];
export type StatsModel = mongoose.InferSchemaType<typeof StatsSchema>;
export const StatsModel = mongoose.model<IStats>("Stats", StatsSchema);

export type UserModel = mongoose.InferSchemaType<typeof userSchema>;
export const UserModel = mongoose.model<UserDocument>("User", userSchema);

export namespace DataBase {
    export async function getUserItems(
        user: User | PartialUser | string,
    ): Promise<ItemDocument[]> {
        const dbUser: UserDocument = await getDBUserFromUser(user);
        const itemNames: string[] = [
            dbUser.inventory.helmet,
            dbUser.inventory.chestplate,
            dbUser.inventory.weapon,
            dbUser.inventory.leggings,
            dbUser.inventory.boots,
            dbUser.inventory.shield,
        ];
        let items: Array<ItemDocument> = [];
        for (const itemName of itemNames) {
            const item = await Item.getFromName(itemName);
            if (item) {
                items.push(item);
            }
        }
        return items;
    }

    export function getDisplayStats(stats: StatsModel): displayStatsFormat[] {
        const attributesArray: displayStatsFormat[] = [
            ["⚔️", "Strength", stats.strength],
            ["🛡️", "Defense", stats.defense],
            ["🏃", "Agility", stats.agility],
            ["✨", "Magicka", stats.magicka],
            ["🔋", "Vitality", stats.vitality],
            ["🏃‍♂️", "Stamina", stats.stamina],
            ["🗣️", "Charisma", stats.charisma],
        ];
        return attributesArray;
    }

    export async function getUserDisplayInfo(
        user: User | PartialUser | string,
    ) {
        const itemsDisplay = Item.getStringCollection(await getUserItems(user));
        const dbUser: UserDocument = await getDBUserFromUser(user);
        const attributesArray = DataBase.getDisplayStats(dbUser.stats);
        return {
            gold: dbUser.inventory.gold,
            xp: dbUser.xp,
            level: dbUser.level,
            skillPoints: dbUser.skillPoints,
            attributesArray,
            items: `📦 Items: \n${itemsDisplay}`,
        };
    }

    export async function applyItem(
        user: User | PartialUser | string,
        item: ItemDocument,
    ) {
        const dbUser = await DataBase.getDBUserFromUser(user);
        const equipmentSlots: Array<keyof IInventory> = [
            "weapon",
            "helmet",
            "chestplate",
            "leggings",
            "boots",
            "shield",
        ];
        console.log(equipmentSlots);
        console.log(item);
        if (equipmentSlots.includes(item.tag as keyof IInventory)) {
            const slotToUpdate = item.tag;

            (dbUser.inventory as any)[slotToUpdate] = item.name;
        } else {
            console.log(
                `failed to applied ${item.name} to ${dbUser.username}'s ${item.tag} slot.`,
            );
            return;
        }

        try {
            await dbUser.save();
            console.log(
                `Successfully applied ${item.name} to ${dbUser.username}'s ${item.tag} slot.`,
            );
        } catch (error) {
            console.error(`Error saving user inventory:`, error);
        }
    }

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
            if (!user || user === null || user === undefined) {
                const user: UserDocument = await UserModel.create({
                    id: new String(id) as string,
                    username: (await getUser(id)).username,
                });
            }
            return user!;
        } catch (err) {
            throw new Error(`Failed to fetch user with ID ${id}: ${err}`);
        }
    }

    export async function giveSkillpoints(
        user: User | PartialUser | string,
        amount: number,
    ) {
        await giveSkillpointsDB(await getDBUserFromUser(user), amount);
    }

    export async function giveSkillpointsDB(
        dbUser: UserDocument,
        amount: number,
    ) {
        dbUser.skillPoints += amount;
        await dbUser.save();
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

        await setGold(user, dbUser.inventory.gold + amount);
        await dbUser.save();
        return amount;
    }
    export async function giveGoldDB(user: UserDocument, amount: number) {
        await setGoldDB(user, user.inventory.gold + amount);
        return amount;
    }
    export async function setGoldDB(user: UserDocument, amount: number) {
        user.inventory.gold = Math.max(-1000, amount);
        await user.save();
        return amount;
    }

    export async function setGold(
        user: User | PartialUser | string,
        amount: number,
    ) {
        let dbUser = await getDBUserFromUser(user);

        dbUser.inventory.gold = Math.max(-1000, amount);
        await dbUser.save();
        return amount;
    }

    export async function upgradeSkillDB(
        dbUser: UserDocument,
        attribute: string,
    ) {
        (dbUser.stats as any)[attribute]++;
        await dbUser.save();
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
        await DataBase.giveSkillpointsDB(dbUser, 1);
        await DataBase.giveGoldDB(dbUser, xp);
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
