import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { AppUser } from "../user";

export default class StatsCommand extends Command.Base {
    // prettier-ignore
    public override main: Command.Command = new Command.Command(
        "stats", "Display your stats", 
        [{ name: "user", description: "Who do you want to stalk?", type: ApplicationCommandOptionType.User }],
        this.onExecute.bind(this),
    );

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = (interaction.options.get("user") || interaction).user;
        if (!userOpt) return interaction.reply(`Failed to get user option`);
        const user = await AppUser.fromID(userOpt.id);

        const message = await this.generateStatsResponse(user, user.discord.id === interaction.user.id);
        return await interaction.reply({
            embeds: message.embed,
            flags: "Ephemeral",
        });
    }

    private async generateStatsResponse(user: AppUser, isMainUser: boolean): Promise<any> {
        const displayInfo = await user.getDisplayInfo();

        let attributeString = "";
        for (const [icon, attribute, value] of displayInfo.attributesArray) {
            attributeString += `${icon}${attribute}: **${value}**\n`;
        }

        const statFields = [];
        statFields.push({
            name: "**Stats:**",
            value: `💰 Gold: ${displayInfo.gold.toFixed(2) || 0}
                🌟 XP: ${displayInfo.xp.toFixed(2) || 0}
                ⬆️ Level: ${displayInfo.level || 0}
                💡 Skill Points: ${displayInfo.skillPoints || 0}`,
            inline: false,
        });

        statFields.push({
            name: "**Attributes**",
            value: attributeString,
            inline: true,
        });

        statFields.push({
            name: "\u200b",
            value: displayInfo.items,
            inline: false,
        });
        statFields.push({
            name: "\u200b",
            value: "\n\n\n",
            inline: false,
        });

        const embed = new EmbedBuilder().setTitle(`${user.discord.displayName}'s`).addFields(statFields);

        return { embed: [embed] };
    }
}
