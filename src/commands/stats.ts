import { Command } from "@/command";
import { DataBase } from "@/models/user";
import {
    EmbedBuilder,
    SlashCommandBuilder,
    type Client,
    type CommandInteraction,
} from "discord.js";

export default class StatsCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("stats")
            .setDescription("display your stats")
            .toJSON();
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        const userInfo = await DataBase.getUserStats(interaction.user.id);

        let attributeString = "";
        for (const attribute of userInfo.attributesArray) {
            attributeString += `${attribute} \n`;
        }

        const statFields = [];
        statFields.push({
            name: "**Stats:**",
            value: `💰 Gold: ${userInfo.gold || 0}
            🌟 XP: ${userInfo.xp || 0}
            ⬆️ Level: ${userInfo.level || 1}
            💡 Skill Points: ${userInfo.skillPoints || 0}`,
            inline: false,
        });

        statFields.push({
            name: "**Attributes**",
            value: attributeString,
            inline: true,
        });

        statFields.push({
            name: "\u200b",
            value: userInfo.items,
            inline: false,
        });

        const userStatsEmbed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s`)
            .addFields(statFields);

        await interaction.reply({ embeds: [userStatsEmbed] });
    }
}
