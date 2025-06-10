import type {
    AutocompleteInteraction,
    ButtonInteraction,
    Client,
    CommandInteraction,
} from "discord.js";
import { UserModel } from "./models/user";
import { Quest } from "./quest";

export namespace Command {
    export abstract class Base {
        abstract get info(): any;
        public async onButtonInteract(
            client: Client,
            interaction: ButtonInteraction,
        ): Promise<boolean> {
            return false;
        }
        async executeAutoComplete(
            client: Client,
            interaction: AutocompleteInteraction,
        ): Promise<void> {
            interaction.respond([]);
        }
        abstract executeCommand(
            client: Client,
            interaction: CommandInteraction,
        ): Promise<void>;
    }

    export const commands = new Map<string, Base>();

    export async function register(client: Client) {
        const glob = new Bun.Glob("./src/commands/*.ts");
        console.log(`Registered commands:`);

        for (const path of glob.scanSync(".")) {
            const { default: CommandClass } = await import(
                path.replace("./src/", "./")
            );
            const instance: Base = new CommandClass();
            const info = instance.info;
            commands.set(info.name, instance);
            client.application?.commands.create(info);
            console.log(`\t${info.name}`);
        }
    }

    export async function handleInteraction(client: Client, interaction: any) {
        const command = commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply("Command not found.");
        }

        try {
            await command.executeCommand(client, interaction);
        } catch (err) {
            console.error(
                `Error running command ${interaction.commandName}:`,
                err,
            );
            interaction.reply("Error executing command.");
        }
    }

    export async function handleAutocompleteInteraction(
        client: Client,
        interaction: any,
    ) {
        const command = commands.get(interaction.commandName);
        if (!command) {
            interaction.respond([]);
            return;
        }
        try {
            await command.executeAutoComplete(client, interaction);
        } catch (err) {
            console.error(
                `Error running autocomplete for command ${interaction.commandName}:`,
                err,
            );
            interaction.respond([]);
        }
    }

    export async function handleButtonInteraction(
        client: Client,
        interaction: any,
    ) {
        for (const command of await commands) {
            try {
                //TODO if inactive command dont check interaction
                if (await command[1].onButtonInteract(client, interaction)) {
                    break;
                }
            } catch (err) {
                console.error(
                    `Error running button interaction for quest ${command[0]}:`,
                    err,
                );
            }
        }
    }

    export async function handleMessageCreate(message: any) {
        let dbUser = await UserModel.findOne({ id: message.author.id });
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
    }
}
