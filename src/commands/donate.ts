import { Command } from "@/commands";
import {
    CommandInteraction,
    InteractionResponse,
    ApplicationCommandOptionType,
    EmbedBuilder,
} from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";

export default class DonateCommand extends Command.Base {
    public override main = new Command.Command(
        "donate",
        "Donate gold to a poor soul (you're so generous ❤️)",
        [
            {
                name: "user",
                description: "The blessed user you're donating to",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: "amount",
                description: "How much gold you want to part with",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
        ],
        this.onExecute,
    );

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const targetUser = interaction.options.get("user")?.user;
        const amount = interaction.options.get("amount")?.value as number;

        if (!targetUser || isNaN(amount)) {
            return interaction.reply({
                content: "Listen genius, either the user or the amount is invalid. Try again.",
                ephemeral: true,
            });
        }

        const donor = await AppUser.fromID(interaction.user.id);
        const receiver = await AppUser.fromID(targetUser.id);

        if (donor.discord.id === receiver.discord.id) {
            return interaction.reply({
                content: "You can't donate to yourself, you greedy little dragon. 🐉",
                ephemeral: true,
            });
        }

        if (amount <= 0) {
            return interaction.reply({
                content: "You're donating negative gold? This ain't a robbery simulator, my man...",
                ephemeral: true,
            });
        }

        if (amount > donor.inventory.gold) {
            return interaction.reply({
                content: `Bro, you're trying to donate more than you own? You're ${donor.discord}, not Elon Musk. 💸`,
                ephemeral: true,
            });
        }

        // Process the transaction
        await donor.addGold(-amount).save();
        await receiver.addGold(amount).save();

        const embed = new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle("💰 WOW!! Donation Incoming!")
            .setDescription(`${donor.discord} donated **${amount}** ${Globals.ATTRIBUTES.gold.emoji} to ${receiver.discord}!`)
            .setFooter({ text: "Look at you, spreading the wealth like Santa 🎅" })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
}
