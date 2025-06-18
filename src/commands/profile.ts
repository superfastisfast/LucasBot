import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";
import { UserDB } from "@/models/user";

export default class ProfileCommand extends Command.Base {
    public override main: Command.Command = new Command.Command(
        "profile",
        "Display your profile",
        [{ name: "user", description: "Who do you want to stalk?", type: ApplicationCommandOptionType.User }],
        this.onExecute.bind(this),
    );

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = (interaction.options.get("user") || interaction).user;
        if (!userOpt) return interaction.reply(`Failed to get user option`);
        const user = await AppUser.fromID(userOpt.id);

        const embed = await this.generateEmbed(user);
        return await interaction.reply({
            embeds: [embed],
            flags: "Ephemeral",
        });
    }

    private async generateEmbed(user: AppUser): Promise<EmbedBuilder> {
        const statsData = UserDB.StatDB.keys.map((key) => ({
            name: Globals.ATTRIBUTES[key].name,
            emoji: Globals.ATTRIBUTES[key].emoji,
            value: user.database.stats[key],
        }));

        const maxNameLength = Math.max(...statsData.map((stat) => stat.name.length));

        const statString = statsData
            .map((stat) => {
                const padded = stat.name.padEnd(maxNameLength, " ");
                return `${stat.emoji} ${padded}: ${stat.value} + ${(user.getStat(stat.name.toLowerCase() as UserDB.StatDB.Type) - stat.value).toFixed(2)}`;
            })
            .join("\n");

        const inventoryLines = [...user.inventory.items]
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([hasItem, itemName]) => `${hasItem ? "✅" : "❌"} ${itemName}`);

        const inventoryString = inventoryLines.length > 0 ? "```" + inventoryLines.join("\n") + "```" : "No items...";

        return new EmbedBuilder()
            .setTitle(`${user.discord.displayName}'s Profile`)
            .setDescription(
                `${Globals.ATTRIBUTES.xp.emoji} ${user.database.xp}\n${Globals.ATTRIBUTES.skillpoint.emoji} ${user.database.skillPoints.toFixed(2)}\n\n**Stats**\n\`\`\`\n${statString}\n\`\`\`\n` +
                    `**Inventory**\n${Globals.ATTRIBUTES.gold.emoji} ${user.inventory.gold.toFixed(2)}\n\n${inventoryString}`,
            )
            .setColor(user.discord.hexAccentColor || 0x3498db)
            .setThumbnail(user.discord.avatarURL())
            .setFooter({ text: "Profile displayed" })
            .setTimestamp();
    }
}
