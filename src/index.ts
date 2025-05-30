import type { Command } from "@/command";
import PingCommand from "@/commands/ping";
import { Client, GatewayIntentBits, Events, Message } from "discord.js";
import mongoose from "mongoose";
import { UserModel } from "./models/user";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let commands = new Map<string, Command>();

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to MongoDB");

    const glob = new Bun.Glob("./src/commands/*.ts");

    for (const path of glob.scanSync(".")) {
        const { default: CommandClass } = await import(path.replace("./src/", "./"));
        const instance: Command = new CommandClass();
        const info = instance.info;
        commands.set(info.name, instance);
        client.application?.commands.create(info);
        console.log(`Registered command: ${info.name}`);
    }

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isCommand()) return;

        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(client, interaction);
        } catch (err) {
            console.error(`Error running command ${interaction.commandName}:`, err);
            interaction.reply("Error executing command.");
        }
    });

    client.on(Events.MessageCreate, async (message) => {
        let dbUser = await UserModel.findOne({ id: message.author.id });

        console.log("\nUsername " + message.author.username);

        if (dbUser) {
            if (dbUser.username !== message.author.username) {
                dbUser.username = message.author.username;
                await dbUser.save();
            }
        } else {
            dbUser = await UserModel.create({
                id: message.author.id,
                username: message.author.username,
            });
        }

        console.log("dbUser", dbUser);
    });
});

//bun add -D prettier

client.login(process.env.BOT_TOKEN);
