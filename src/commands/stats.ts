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
        const embed = await user.getDisplayStatInfo();

        return { embed: [embed] };
    }
}
