import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, EmbedBuilder, type APIEmbedField, ButtonInteraction, ButtonStyle } from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";
import { Item } from "@/models/item";
import { AppButton } from "@/button";

export default class ShopCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("shop", "Buy some cool items", [], this.onExecute.bind(this));

    endTime: number = new Date().getTime();
    stock: number = 4;
    items: Item.Base[] = [];

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        if (this.endTime < new Date().getTime()) {
            this.items = [];
            for (let i = 0; i < this.stock; i++) {
                const item = await Item.manager.getRandom();
                if (!item) return await interaction.reply({ content: "No items found", flags: "Ephemeral" });
                this.items.push(item);
            }
            this.endTime = new Date().getTime() + 1000 * 60 * 15;
        }

        const embed = await this.generateEmbed(await AppUser.fromID(interaction.user.id));
        const actionRow = AppButton.createActionRow(await this.generateButtons(await AppUser.fromID(interaction.user.id)), 2);

        return interaction.reply({
            embeds: [embed],
            components: actionRow,
            flags: "Ephemeral",
        });
    }

    private async generateEmbed(user: AppUser): Promise<EmbedBuilder> {
        let fields: APIEmbedField[] = [];

        this.items.forEach((item, i) => {
            const flatModifiers = Object.entries(item.flatModifiers ?? {})
                .filter(([_, v]) => v !== 0)
                .map(([k, v]) => `${Globals.ATTRIBUTES[k as keyof typeof Globals.ATTRIBUTES].emoji} ${v > 0 ? "+" : ""}${v}`)
                .join("\n");

            const percentageModifiers = Object.entries(item.percentageModifiers ?? {})
                .filter(([_, v]) => v !== 0)
                .map(([k, v]) => `${Globals.ATTRIBUTES[k as keyof typeof Globals.ATTRIBUTES].emoji} ${v > 0 ? "+" : ""}${v * 100}%`)
                .join("\n");

            const modifiers = [flatModifiers, percentageModifiers].filter(Boolean).join("\n");

            fields.push({
                name: item.name.slice(0, 23),
                value: `\`\`\`Cost: ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}\nType: ${item.type ?? "???"}${modifiers ? `\n\n${modifiers}` : "\n\n"}\`\`\``,
                inline: true,
            });

            if (this.stock <= 4 && i % 2 === 0) fields.push({ name: "\u200B", value: "\u200B", inline: true });
        });

        return new EmbedBuilder()
            .setTitle("Shop")
            .setDescription(`Items for sale!\nYou have ${user.inventory.gold.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`)
            .setColor("#A6F7CB")
            .setURL(Globals.LINK)
            .setFooter({ text: "Shop opened" })
            .setTimestamp()
            .addFields(fields.slice(0, 25));
    }

    private async generateButtons(user: AppUser): Promise<AppButton[]> {
        let buttons: AppButton[] = [];

        this.items.forEach((item) => {
            buttons.push(
                new AppButton(
                    `${item.name} (${item.cost} ${Globals.ATTRIBUTES.gold.emoji})`,
                    async (interaction: ButtonInteraction) => {
                        if (!item)
                            return interaction.reply({
                                content: "Failed to fetch item from ",
                            });

                        const user = await AppUser.fromID(interaction.user.id);
                        if (item.cost > user.inventory.gold)
                            return interaction.reply({
                                content: `You don't have enough money to buy a ${item.name}`,
                                flags: "Ephemeral",
                            });

                        await user.addItem(item).addGold(-item.cost).save();

                        const possiblePurchaseMessage = [
                            `You now own a ${item.name} worth ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}.`,
                            `Payment successful for ${item.name}, cost: ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}.`,
                            `You've purchased ${item.name} for ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}. Nice choice!`,
                            `Transaction complete! ${item.name} is yours for just ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}.`,
                            `A shiny new ${item.name} has been added to your inventory. (${item.cost} ${Globals.ATTRIBUTES.gold.emoji} spent)`,
                            `${Globals.ATTRIBUTES.gold.emoji} well spent! You bought ${item.name} for ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}.`,
                            `You handed over ${item.cost} ${Globals.ATTRIBUTES.gold.emoji} and received a ${item.name}. Fair trade.`,
                            `Enjoy your new ${item.name}! It only cost you ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}.`,
                            `You've successfully acquired ${item.name}. (${item.cost} ${Globals.ATTRIBUTES.gold.emoji} deducted)`,
                            `Cha-ching! ${item.name} is now yours for ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}.`,
                            `The deal is done. ${item.name} is yours for ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}.`,
                        ];

                        const purchaseMessage: string = possiblePurchaseMessage[Globals.random(0, possiblePurchaseMessage.length - 1)]!;

                        const embed = await this.generateEmbed(await AppUser.fromID(interaction.user.id));
                        const actionRow = AppButton.createActionRow(await this.generateButtons(await AppUser.fromID(interaction.user.id)), 2);

                        return interaction.update({
                            content: purchaseMessage,
                            embeds: [embed],
                            components: actionRow,
                        });
                    },
                    item.cost > user.inventory.gold ? ButtonStyle.Danger : ButtonStyle.Success,
                ),
            );
        });

        return buttons;
    }
}
