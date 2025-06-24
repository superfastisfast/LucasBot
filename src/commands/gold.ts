import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType } from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";

export default class GoldCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("gold", "Gold related stuff", [], undefined, undefined, true);
    public override subs: Command.Command[] = [
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
