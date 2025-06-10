import { Command } from "@/command";
import { Service } from "@/service";
import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import mongoose from "mongoose";
import { Quest } from "./quest";

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
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to MongoDB");

    (async () => {
        await Service.load(client);
        await Service.start(client);
        await Command.register(client);
        await Quest.loadQuests();
    })();

    Quest.generateRadomQuest(client);
    setInterval(
        () => {
            Quest.generateRadomQuest(client);
        },
        1000 * 60 * 30,
        // 1000,
    );

    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isCommand()) {
            await Command.handleInteraction(client, interaction);
        } else if (interaction.isAutocomplete()) {
            await Command.handleAutocompleteInteraction(client, interaction);
        } else if (interaction.isButton()) {
            await Command.handleButtonInteraction(client, interaction);
            await Quest.handleButtonInteraction(client, interaction);
        }
    });

    client.on(Events.MessageCreate, async (message) => {
        await Command.handleMessageCreate(message);
    });

    await Service.stop(client);
});

client.login(process.env.BOT_TOKEN);
