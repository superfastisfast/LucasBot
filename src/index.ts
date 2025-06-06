import { Cmd, type Command } from "@/command";
import { Service } from "@/service";
import {
    Client,
    GatewayIntentBits,
    Events,
} from "discord.js";
import mongoose from "mongoose";
import { Quest } from "./quest";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});


client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to MongoDB");

    (async () => {
        await Service.load(client);
        Service.start(client);
        await Cmd.register(client);
        await Quest.loadQuests();
    })();
    

    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isCommand()) {
            await Cmd.handleInteraction(client, interaction);
        } else if (interaction.isAutocomplete()) {
            await Cmd.handleAutocompleteInteraction(client, interaction);
        } else if (interaction.isButton()) {
            await Cmd.handleButtonInteraction(client, interaction);
        }
    });

    client.on(Events.MessageCreate, async (message) => {
        await Cmd.handleMessageCreate(message);
    });

    Service.stop(client)
});

client.login(process.env.BOT_TOKEN);
