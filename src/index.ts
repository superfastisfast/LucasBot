import { Service } from "@/service";
import { Client, GatewayIntentBits, Partials, Events, TextChannel } from "discord.js";
import mongoose from "mongoose";
import { Quest } from "./quest";
import { Command } from "./commands";

export namespace Globals {
    export const ATTRIBUTES = {
        strength: {
            name: "Strength",
            value: "strength",
            emoji: "💪",
        },
        defense: {
            name: "Defense",
            value: "defense",
            emoji: "🛡️",
        },
        agility: {
            name: "Agility",
            value: "agility",
            emoji: "💨",
        },
        magicka: {
            name: "Magicka",
            value: "magicka",
            emoji: "🔮",
        },
        vitality: {
            name: "Vitality",
            value: "vitality",
            emoji: "❤️",
        },
        stamina: {
            name: "Stamina",
            value: "stamina",
            emoji: "🔋",
        },
        charisma: {
            name: "Charisma",
            value: "charisma",
            emoji: "🔥",
        },
        gold: {
            name: "Gold",
            value: "gold",
            emoji: "💰",
        },
        xp: {
            name: "XP",
            value: "xp",
            emoji: "🌟",
        },
        skillpoint: {
            name: "Skillpoint",
            value: "skillpoint",
            emoji: ":bulb:",
        },
        items: {
            name: "Items",
            value: "items",
            emoji: "📦",
        },
        level: {
            name: "Level",
            value: "level",
            emoji: "⬆️",
        },
        health: {
            name: "health",
            value: "health",
            emoji: "❤️",
        },
        mana: {
            name: "mana",
            value: "mana",
            emoji: "🔵",
        },
    };

    export const LINK: string = "https://www.youtube.com/@LucasDevelop";
    export let CHANNEL: TextChannel;
    export const MISSING_PERMS = "You don't have the right permissions to execute this command";

    export function random(max: number, min: number = 0): number {
        if (min > max) return min;
        return Math.floor(Math.random() * (max - min) + min);
    }
}

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User],
});

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`${new Date().toISOString()} Bot connected as '${readyClient.user.tag}'`);

    await mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost:27017/mydiscordapp");
    console.log("Connected to MongoDB");

    (async () => {
        if (!process.env.QUEST_CHANNEL_ID) throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        Globals.CHANNEL = (await client.channels.fetch(process.env.QUEST_CHANNEL_ID)) as TextChannel;

        await Service.load(client);
        await Service.start(client);
        await Quest.load();
        await Command.load();
    })();

    await Service.stop(client);
});

client.login(process.env.BOT_TOKEN);
