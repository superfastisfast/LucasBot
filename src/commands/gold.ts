import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";
import { InventoryDB } from "@/models/inventory";

export default class GoldCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("gold", "Gold related stuff", []);
    public override subs: Command.Command[] = [
        new Command.Command("top", "Shows you the top 10 people based on gold", [], this.onTop),
        new Command.Command(
            "set",
            "Set a users gold to a value",
            [
                {
                    name: "user",
                    description: "The user that you want to affect",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "amount",
                    description: "The amount you want to set",
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                },
            ],
            this.onSet,
            undefined,
            true,
        ),
        new Command.Command(
            "add",
            "Add gold to a user",
            [
                {
                    name: "user",
                    description: "The user that you want to affect",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "amount",
                    description: "The amount you want to give",
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                },
            ],
            this.onAdd,
            undefined,
            true,
        ),
    ];

    public async onTop(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const topUsers = await InventoryDB.Model.find().sort({ gold: -1 }).limit(10).exec();

        if (topUsers.length === 0) return await interaction.reply("No users found in the leaderboard.");

        const lines = await Promise.all(
            topUsers.map(async (dbuser, index) => {
                const user = await AppUser.fromID(dbuser.id);
                return `#${index + 1} ${user.discord.displayName}:   ${user.inventory.gold.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`;
            }),
        );
        const description = lines.join("\n");

        const embed = new EmbedBuilder().setTitle("🏆 Gold Leaderboard").setDescription(description).setColor("#FFD700");

        return await interaction.reply({ embeds: [embed] });
    }

    public async onSet(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = interaction.options.get("user")?.user;
        const amountOpt = interaction.options.get("amount")?.value as number;
        if (!userOpt) return interaction.reply({ content: `Failed to get user option`, flags: "Ephemeral" });

        const user = await AppUser.fromID(userOpt.id);

        await user.setGold(amountOpt).save();

        return interaction.reply({ content: `Set ${user.discord}'s ${Globals.ATTRIBUTES.gold.emoji} ${amountOpt}`, flags: "Ephemeral" });
    }

    public async onAdd(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = interaction.options.get("user")?.user;
        const amountOpt = interaction.options.get("amount")?.value as number;
        if (!userOpt) return interaction.reply({ content: `Failed to get user option`, flags: "Ephemeral" });

        const user = await AppUser.fromID(userOpt.id);

        await user.addGold(amountOpt).save();

        return interaction.reply({ content: `Added ${amountOpt} ${Globals.ATTRIBUTES.gold.emoji} to ${user.discord}`, flags: "Ephemeral" });
    }
}
