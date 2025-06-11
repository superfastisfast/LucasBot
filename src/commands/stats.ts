import { Command } from "@/command";
import { AppUser } from "@/user";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
    User,
    type Client,
    type CommandInteraction,
} from "discord.js";

export default class StatsCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("stats")
            .setDescription("display your stats")
            .addUserOption((option) =>
                option
                    .setName("user")
                    .setDescription("who do you wanna stalk?"),
            )
            .toJSON();
    }

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        const user = await AppUser.createFromID(interaction.user.id);
        const userInfo = await user.getDisplayInfo();

        for (const [icon, attribute, value] of userInfo.attributesArray) {
            if (interaction.customId === interaction.user.id + attribute) {
                await interaction.deferUpdate();

                await user.upgradeSkill(attribute!.toLowerCase());
                await user.addSkillPoints(-1);
                const replyMsg = await this.generateStatsResponse(
                    interaction.user,
                    true,
                );
                interaction.editReply({
                    content: `You upgraded: **${attribute!.toUpperCase()}**`,
                    embeds: replyMsg.embed,
                    components: replyMsg.components,
                });
            }
        }

        return false;
    }

    private async generateStatsResponse(user: User, isMainUser: boolean) {
        const appUser = await AppUser.createFromID(user.id);
        const userInfo = await appUser.getDisplayInfo();

        let attributeString = "";
        for (const [icon, attribute, value] of userInfo.attributesArray) {
            attributeString += `${icon}${attribute}: **${value}**\n`;
        }

        const statFields = [];
        statFields.push({
            name: "**Stats:**",
            value: `💰 Gold: ${userInfo.gold.toFixed(2) || 0}
            🌟 XP: ${userInfo.xp.toFixed(2) || 0}
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
            .setTitle(`${appUser.discord.username}'s`)
            .addFields(statFields);

        const actionRows: ActionRowBuilder<ButtonBuilder>[] = [];
        let currentActionRow = new ActionRowBuilder<ButtonBuilder>();
        let buttonsInCurrentRow = 0;

        if (userInfo.skillPoints > 0 && isMainUser) {
            userStatsEmbed.addFields({
                name: `**You got (${userInfo.skillPoints}) skillpoints to use**`,
                value: "what do u wanna upgrade?",
                inline: true,
            });
            for (const [icon, attribute, value] of userInfo.attributesArray) {
                if (buttonsInCurrentRow === 5) {
                    actionRows.push(currentActionRow);
                    currentActionRow = new ActionRowBuilder<ButtonBuilder>();
                    buttonsInCurrentRow = 0;
                }

                const button = new ButtonBuilder()
                    .setCustomId(appUser.discord.id + attribute)
                    .setLabel(`${icon}${attribute}`)
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
        let user = interaction.options.get("user")?.user;
        user =
            user &&
            user !== null &&
            user !== undefined &&
            user.id !== interaction.user.id
                ? user
                : interaction.user;
        const replyMsg = await this.generateStatsResponse(
            user,
            user === interaction.user,
        );
        await interaction.editReply({
            embeds: replyMsg.embed,
            components: replyMsg.components,
        });
    }
}
