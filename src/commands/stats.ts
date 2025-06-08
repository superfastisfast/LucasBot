import { Command } from "@/command";
import { DataBase } from "@/models/user";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
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

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        return true;
    }

    private async generateStatsResponse(interaction: CommandInteraction) {
        const userInfo = await DataBase.getUserStats(interaction.user.id);

        let attributeString = "";
        for (const attribute of userInfo.attributesArray) {
            attributeString += `${attribute.join(": ")} \n`;
        }

        const statFields = [];
        statFields.push({
            name: "**Stats:**",
            value: `💰 Gold: ${userInfo.gold || 0}
            🌟 XP: ${userInfo.xp || 0}
            ⬆️ Level: ${userInfo.level || 0}
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
        statFields.push({
            name: "\u200b",
            value: "\n\n\n",
            inline: false,
        });

        const userStatsEmbed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s`)
            .addFields(statFields);

        const actionRows: ActionRowBuilder<ButtonBuilder>[] = [];
        let currentActionRow = new ActionRowBuilder<ButtonBuilder>();
        let buttonsInCurrentRow = 0;

        if (userInfo.skillPoints > 0) {
            userStatsEmbed.addFields({
                name: `**You got (${userInfo.skillPoints}) skillpoints to use**`,
                value: "what do u wanna upgrade?",
                inline: true,
            });
            for (const [attribute, value] of userInfo.attributesArray) {
                if (buttonsInCurrentRow === 5) {
                    actionRows.push(currentActionRow);
                    currentActionRow = new ActionRowBuilder<ButtonBuilder>();
                    buttonsInCurrentRow = 0;
                }

                const button = new ButtonBuilder()
                    .setCustomId(interaction.user.id + attribute)
                    .setLabel(`${attribute}`)
                    .setStyle(ButtonStyle.Primary);

                currentActionRow.addComponents(button);
                buttonsInCurrentRow++;
            }
        }

        if (buttonsInCurrentRow > 0) {
            actionRows.push(currentActionRow);
        }

        return { embed: [userStatsEmbed], components: actionRows };
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        await interaction.deferReply({ flags: "Ephemeral" });
        const replyMsg = await this.generateStatsResponse(interaction);
        await interaction.editReply({
            embeds: replyMsg.embed,
            components: replyMsg.components,
        });
    }
}
