import type { AutocompleteInteraction, Client, CommandInteraction } from "discord.js";

export abstract class Command {
    abstract get info(): any;
    async executeAutoComplete(client: Client, interaction: AutocompleteInteraction): Promise<void> {
        interaction.respond([]);
    }
    abstract executeCommand(client: Client, interaction: CommandInteraction): Promise<void>;
}
