import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType } from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";

export default class DonateCommand extends Command.Base {
    public override main = new Command.Command(
        "donate",
        "Dontate gold to a poor person",
        [
            {
                name: "user",
                description: "The user that you want give the gold to",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: "amount",
                description: "The amount you want to donate",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
        ],
        this.onExecute,
    );

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const poorOpt = interaction.options.get("user")?.user;
        const amountOpt = interaction.options.get("amount")?.value as number;
        if (!poorOpt) return interaction.reply(`Failed to get user option`);

        const user = await AppUser.fromID(interaction.user.id);
        const poor = await AppUser.fromID(poorOpt.id);

        if (amountOpt < 0)
            return interaction.reply({
                content: "What are you a thief?",
                flags: "Ephemeral",
            });
        if (amountOpt > user.inventory.gold)
            return interaction.reply(`${user.discord} tried to donate ${amountOpt} ${Globals.ATTRIBUTES.gold.emoji} to ${poor.discord}`);

        await user.addGold(-amountOpt).save();
        await poor.addGold(amountOpt).save();

        return interaction.reply(`${user.discord} donated ${amountOpt} ${Globals.ATTRIBUTES.gold.emoji} to ${poor.discord}`);
    }
}
