import { Command } from "@/commands";
import {
    CommandInteraction,
    InteractionResponse,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ButtonInteraction,
    ButtonStyle,
    AutocompleteInteraction,
} from "discord.js";
import { AppUser } from "../user";
import { AppButton } from "@/ui";
import { UserDB } from "@/models/user";
import { Model, Document } from "../models/user";
import { InventoryDB } from "@/models/inventory";

export default class ResetCommand extends Command.Base {
    public override main: Command.Command = new Command.Command(
        "reset",
        "Resets a user",
        [
            { name: "user", description: "The person that will be reset?", type: ApplicationCommandOptionType.User, required: true },
            {
                name: "things",
                description: "What thing you want to reset",
                type: ApplicationCommandOptionType.Number,
                required: false,
                autocomplete: true,
            },
        ],
        this.onExecute,
        this.onAutocomplete,
        true,
    );

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = interaction.options.get("user");
        const thingsOpt = interaction.options.get("things");
        if (!userOpt) return interaction.reply(`Failed to get user option`);
        const user = await AppUser.fromID(userOpt.user.id);
        const things = thingsOpt ? (thingsOpt.value as number) : 0;

        const embed = new EmbedBuilder()
            .setTitle("⚠️ Reset ⚠️")
            .setDescription(`Are you sure you want to reset **${user.discord}**`)
            .setThumbnail(user.discord.avatarURL());

        let message: InteractionResponse<boolean> | null = null;

        const yes = new AppButton(
            "Yes ⚠️",
            async (interaction: ButtonInteraction) => {
                if (things === 0) await UserDB.Model.deleteOne({ id: user.discord.id });
                if (things === 0 || things === 2) await InventoryDB.Model.deleteOne({ username: user.discord.username });

                if (things === 3) user.database.level = 0;
                if (things === 4) user.setXP(0);
                if (things === 5) user.setGold(0);
                if (things === 6) user.setSkillPoints(0);

                await user.save();

                console.log(
                    `${new Date().toISOString()} ⚠️ WARNING ⚠️: User ${interaction.user.username} or ${interaction.user.displayName} reset user ${user.discord.username} or ${user.discord.displayName}`,
                );

                await interaction.reply({ content: "User reset.", flags: "Ephemeral" });
            },
            ButtonStyle.Danger,
        );

        const cancel = new AppButton(
            "Cancel 🚫",
            async (interaction: ButtonInteraction) => {
                message?.delete();
            },
            ButtonStyle.Primary,
        );

        const actionRow = AppButton.createActionRow([yes, cancel]);

        message = await interaction.reply({
            embeds: [embed],
            components: actionRow,
            flags: "Ephemeral",
        });
        return message;
    }

    public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        await interaction.respond([
            { name: "All", value: 0 },
            // { name: "Stats", value: 1 },
            { name: "Inventory", value: 2 },
            { name: "Level", value: 3 },
            { name: "XP", value: 4 },
            { name: "Gold", value: 5 },
            { name: "Skillpoint", value: 6 },
        ]);
    }
}
