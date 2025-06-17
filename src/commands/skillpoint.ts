import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, AutocompleteInteraction, User } from "discord.js";
import { AppUser } from "../user";
import { UserDB } from "@/models/user";

export default class SkillpointCommand extends Command.Base {
    public override main: Command.Command = new Command.Command(
        "skillpoint",
        "Display your profile",
        [
            {
                name: "skill",
                description: "What skill you want to upgrade",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
            },
        ],
        this.onExecute,
        this.onAutocomplete,
    );

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const skillOpt = interaction.options.get("skill", true).value as string;
        const user = await AppUser.fromID(interaction.user.id);

        if (user.database.skillPoints >= 1) {
            (user.database.stats as any)[skillOpt] += 1;
            user.database.skillPoints -= 1;
            await user.database.save();
        }

        return await interaction.reply({
            content: user.database.skillPoints >= 1 ? `You upgraded '${skillOpt}'` : "You do not have enough skillpoints to spend",
            flags: "Ephemeral",
        });
    }

    public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const types = UserDB.StatDB.keyArray.map((key) => ({ name: key, value: key }));
        return interaction.respond(types);
    }
}
