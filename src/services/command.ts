import { Command } from "@/commands";
import { Service } from "@/service";
import { Client, Events, type Interaction, MessageFlags } from "discord.js";

export default class CommandService extends Service.Base {
    override async start(client: Client): Promise<void> {
        client.on(Events.InteractionCreate, this.handleCommand);
    }

    override async stop(client: Client): Promise<void> {
        client.off(Events.InteractionCreate, this.handleCommand);
    }

    private handleCommand = async (interaction: Interaction) => {
        if (interaction.isCommand()) {
            const command = Command.commands.get(interaction.commandName);
            if (!command) {
                interaction.reply(`Command not found: '${interaction.commandName}'`);
                return;
            }

            const subName = (interaction.options as any).getSubcommand(false);
            if (!subName) await command.main.onExecute(interaction);
            else
                command.subs.forEach(async (sub) => {
                    if (subName === sub.name) await sub.onExecute(interaction);
                });
        }

        if (interaction.isAutocomplete()) {
            const command = Command.commands.get(interaction.commandName);
            if (!command) {
                interaction.respond([{ name: "Missing autocomplete", value: "undefined" }]);
                return;
            }

            const subName = (interaction.options as any).getSubcommand(false);
            if (!subName) await command.main.onAutocomplete(interaction);
            else
                command.subs.forEach(async (sub) => {
                    if (subName === sub.name) await sub.onAutocomplete(interaction);
                });
        }
    };
}
