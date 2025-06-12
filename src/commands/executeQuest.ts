import { Command } from "@/command";
import { NewQuest } from "@/new_quest";
import {
    AutocompleteInteraction,
    InteractionContextType,
    SlashCommandBuilder,
    type Client,
    type CommandInteraction,
} from "discord.js";

export default class ExecuteQuestCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("executequest")
            .setDescription("Execute a Quest")
            .addStringOption((option) =>
                option
                    .setName("class")
                    .setDescription("class of quest")
                    .setAutocomplete(true)
                    .setRequired(true),
            )
            .setDefaultMemberPermissions(0n)
            .setContexts(InteractionContextType.Guild)
            .toJSON();
    }

    override async executeAutoComplete(
        client: Client,
        interaction: AutocompleteInteraction,
    ): Promise<void> {
        const focusedOption = interaction.options.getFocused(true).name;
        if (focusedOption == "class") {
            const options = [...NewQuest.quests.keys()].map(q => ({
                name: q,
                value: q,
            }));

            await interaction.respond(options);
            return;
        }
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        const name = interaction.options.get("class", true).value as string;
    
        const quest = NewQuest.quests.get(name);
    
        if (!quest) {
            await interaction.reply(`Quest class "${name}" not found.`);
            return;
        }
    
        await interaction.reply(`Executing quest: "${name}"`);
        await quest.start(client);
    }
}
