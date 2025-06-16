import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { AppUser } from "../user";

export default class ProfileCommand extends Command.Base {
    // prettier-ignore
    public override main: Command.Command = new Command.Command(
        "profile", "Display your stats", 
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
        const statsData = [
            { name: "Strength", value: user.database.stats.strength, emoji: "💪" },
            { name: "Defense", value: user.database.stats.defense, emoji: "🛡️" },
            { name: "Agility", value: user.database.stats.agility, emoji: "💨" },
            { name: "Magicka", value: user.database.stats.magicka, emoji: "🔮" },
            { name: "Vitality", value: user.database.stats.vitality, emoji: "❤️" },
            { name: "Stamina", value: user.database.stats.stamina, emoji: "🔋" },
            { name: "Charisma", value: user.database.stats.charisma, emoji: "🔥" },
        ];

        const maxNameLength = Math.max(...statsData.map((s) => s.name.length));

        const statLines = statsData.map((stat) => {
            const paddedName = stat.name.padEnd(maxNameLength, " ");
            return `${stat.emoji} ${paddedName}: ${stat.value}`;
        });

        const statString = "```" + statLines.join("\n") + "```";

        let inventoryString = "";

        for (const [booleanValue, stringValue] of [...user.inventory.items].sort(
            (a, b) => (b[0] === true ? 1 : 0) - (a[0] === true ? 1 : 0),
        )) {
            const status = booleanValue ? "✅ (Ready)" : "❌"; // Compact status display
            inventoryString += `${status} ${stringValue}\n`;
        }

        return new EmbedBuilder()
            .setTitle(`${user.discord.displayName}'s Current Stats`)
            .setDescription(
                `**Stats**\n${statString}\n\n**Inventory**\n${inventoryString !== "" ? inventoryString : "No items..."}`,
            )
            .setColor(user.discord.hexAccentColor || 0x3498db)
            .setThumbnail(user.discord.avatarURL())
            .setFooter({ text: "Stats displayed" })
            .setTimestamp();
    }
}
