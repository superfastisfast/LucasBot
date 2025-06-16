import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";

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
        // prettier-ignore
        const statsData = [
            { name: Globals.STATS.strength.name, value: user.database.stats.strength, emoji: Globals.STATS.strength.emoji },
            { name: Globals.STATS.defense.name, value: user.database.stats.defense, emoji: Globals.STATS.defense.emoji },
            { name: Globals.STATS.agility.name, value: user.database.stats.agility, emoji: Globals.STATS.agility.emoji },
            { name: Globals.STATS.magicka.name, value: user.database.stats.magicka, emoji: Globals.STATS.magicka.emoji },
            { name: Globals.STATS.vitality.name, value: user.database.stats.vitality, emoji: Globals.STATS.vitality.emoji },
            { name: Globals.STATS.stamina.name, value: user.database.stats.stamina, emoji: Globals.STATS.stamina.emoji },
            { name: Globals.STATS.charisma.name, value: user.database.stats.charisma, emoji: Globals.STATS.charisma.emoji },
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
