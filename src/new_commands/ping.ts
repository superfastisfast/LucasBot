import { NewCommand } from "@/new_commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType } from "discord.js";

export default class PingCommand extends NewCommand.Base {
    public override main = new NewCommand.Command(
        "ping",
        "Sabotage Lucas's dreams of getting a video out any time soon",
        [{ name: "str2", description: "Yes Sigma", type: ApplicationCommandOptionType.String, required: true }],
        this.onExecute.bind(this),
    );
    public override subs: NewCommand.Command[] = [];

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const str = interaction.options.get("str")?.value as string;
        return interaction.reply(`Pong! ${str}`);
    }
}
