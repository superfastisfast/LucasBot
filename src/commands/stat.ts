import { Command } from "@/commands";
import {
    CommandInteraction,
    InteractionResponse,
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    type ApplicationCommandOptionChoiceData,
} from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";
import { UserDB } from "@/models/user";

export default class GoldCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("stat", "Stat related stuff", [], undefined, undefined, true);
    public override subs: Command.Command[] = [
        new Command.Command(
            "set",
            "Set a users gold to a value",
            [
                {
                    name: "user",
                    description: "The user that you want the stat for",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "stat",
                    description: "The stat you want to set",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
                {
                    name: "amount",
                    description: "The level you want the stat to be",
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                },
            ],
            this.onAdd,
            this.onAutocomplete,
            true,
        ),
        new Command.Command(
            "add",
            "Add gold to a user",
            [
                {
                    name: "user",
                    description: "The user that you want the stat for",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "stat",
                    description: "The stat you want to add to",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
                {
                    name: "amount",
                    description: "The level you want the stat to be",
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                },
            ],
            this.onAdd,
            this.onAutocomplete,
            true,
        ),
    ];

    public async onSet(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = interaction.options.get("user")?.user;
        const statOpt = interaction.options.get("stat")?.value as UserDB.StatDB.Type;
        const amountOpt = interaction.options.get("amount")?.value as number;
        if (!userOpt) return interaction.reply({ content: `Failed to get user option`, flags: "Ephemeral" });

        const user = await AppUser.fromID(userOpt.id);
        user.database.stats[statOpt] = amountOpt;
        await user.save();

        return interaction.reply({
            content: `Set ${user.discord}'s stat ${Globals.ATTRIBUTES[statOpt].emoji} ${Globals.ATTRIBUTES[statOpt].name} to ${amountOpt}`,
            flags: "Ephemeral",
        });
    }

    public async onAdd(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = interaction.options.get("user")?.user;
        const statOpt = interaction.options.get("stat")?.value as UserDB.StatDB.Type;
        const amountOpt = interaction.options.get("amount")?.value as number;
        if (!userOpt) return interaction.reply({ content: `Failed to get user option`, flags: "Ephemeral" });

        const user = await AppUser.fromID(userOpt.id);
        user.database.stats[statOpt] += amountOpt;
        await user.save();

        return interaction.reply({
            content: `Added ${amountOpt} to ${user.discord}'s ${Globals.ATTRIBUTES[statOpt].emoji} ${Globals.ATTRIBUTES[statOpt].name} stat`,
            flags: "Ephemeral",
        });
    }

    public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const options: ApplicationCommandOptionChoiceData[] = UserDB.StatDB.keyArray.map((key) => ({
            name: key,
            value: key,
        }));

        await interaction.respond(options);
    }
}
