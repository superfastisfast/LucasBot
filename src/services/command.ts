import { NewCommand } from "@/new_commands";
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
        if (interaction.isChatInputCommand()) {
            try {
                const commandInstance = NewCommand.commands.get(interaction.commandName);
                if (!commandInstance) {
                    return await interaction.reply({ content: "Command not found.", flags: [MessageFlags.Ephemeral] });
                }

                let targetExecutionLogic: NewCommand.Command = commandInstance.main;
                const subcommandName = interaction.options.getSubcommand(false);

                if (subcommandName) {
                    const foundSub = commandInstance.subs.find((sub) => sub.name === subcommandName);
                    if (foundSub) {
                        targetExecutionLogic = foundSub;
                    } else {
                        return await interaction.reply({
                            content: "Subcommand not found.",
                            flags: [MessageFlags.Ephemeral],
                        });
                    }
                }

                await targetExecutionLogic.onExecute(interaction);
            } catch (error) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: "An error occurred.", flags: [MessageFlags.Ephemeral] });
                } else {
                    await interaction.reply({ content: "An error occurred.", flags: [MessageFlags.Ephemeral] });
                }
            }
        } else if (interaction.isAutocomplete()) {
            try {
                const commandInstance = NewCommand.commands.get(interaction.commandName);
                if (!commandInstance) {
                    return await interaction.respond([]);
                }

                let targetAutocompleteLogic: NewCommand.Command = commandInstance.main;
                const subcommandName = interaction.options.getSubcommand(false);

                if (subcommandName) {
                    const foundSub = commandInstance.subs.find((sub) => sub.name === subcommandName);
                    if (foundSub) {
                        targetAutocompleteLogic = foundSub;
                    }
                }

                await targetAutocompleteLogic.onAutocomplete(interaction);
            } catch (error) {
                await interaction.respond([]);
            }
        }
    };
}
