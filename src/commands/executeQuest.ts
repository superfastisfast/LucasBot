import { Command } from "@/command";
import { Quest } from "@/quest";
import { SlashCommandBuilder, type Client, type CommandInteraction } from "discord.js";

export default class ExecuteQuestCommand extends Command {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("executequest")
            .setDescription("Execute a Quest")
            .addStringOption((option) =>
                option.setName("class").setDescription("class of quest").setAutocomplete(true).setRequired(true),
            )
            .toJSON();
    }

    override async executeCommand(client: Client, interaction: CommandInteraction): Promise<void> {
        const className = interaction.options.get("class", true).value as string;

        const quest = Quest.getQuest(className);
        if (!quest) {
            await interaction.reply(`Quest class "${className}" not found.`);
            return;
        }

        await interaction.reply(`Executing quest: "${className}"`);
        await quest.startQuest(client);
    }
}
