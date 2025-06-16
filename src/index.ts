import { Service } from "@/service";
import { Client, GatewayIntentBits, Partials, Events, ActivityType } from "discord.js";
import mongoose from "mongoose";
import { Quest } from "./quest";
import { Command } from "./commands";

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
    // Clear command cache
    // const rest = new REST({ version: "9" }).setToken(process.env.BOT_TOKEN || "undefined")

    // rest.put(Routes.applicationCommands(client.user?.id || "undefined"), { body: [] })
    // 	.then(() => console.log('Successfully deleted all application commands.'))
    // 	.catch(console.error);

    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost:27017/mydiscordapp");
    console.log("Connected to MongoDB");

    (async () => {
        await Service.load(client);
        await Service.start(client);
        await Quest.load();
        await Command.load();
    })();

    await Service.stop(client);
});

client.login(process.env.BOT_TOKEN);
