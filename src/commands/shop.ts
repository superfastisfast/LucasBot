import { Command } from "@/commands";
import {
    CommandInteraction,
    InteractionResponse,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    Events,
    type APIEmbedField,
} from "discord.js";
import { AppUser } from "../user";
import { client, Globals } from "..";
import { Item } from "@/models/item";

export default class ShopCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("shop", "Buy some cool items", [], this.onExecute.bind(this));

    stock: number = 10;

    items: Item.Base[] = [];

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        for (let i = 0; i < this.stock; i++) {
            const item = await Item.manager.getRandom();
            if (!item) {
                await interaction.reply({ content: "No items found", flags: "Ephemeral" });
                continue;
            }
            this.items.push(item);
        }

        const embed = await this.generateEmbed();
        const actionRow = await this.handleItemOptions();

        return interaction.reply({
            embeds: [embed],
            components: [actionRow],
            flags: "Ephemeral",
        });
    }

    public async handleItemOptions(): Promise<any> {
        let options: StringSelectMenuOptionBuilder[] = [];

        this.items.forEach((item, i) => {
            const label = item.name;
            const value = `${i}_shop_item`;
            const description = `Cost: ${item.cost} gold`;

            options.push(new StringSelectMenuOptionBuilder().setLabel(label).setValue(value).setDescription(description));
        });

        const select = new StringSelectMenuBuilder().setCustomId("buy_items").setPlaceholder("Choose an item to buy").addOptions(options);

        // Handle event processing
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isStringSelectMenu()) return;
            const selected = interaction.values[0];

            const index: number = new Number(selected?.slice(0, 1)) as number;
            if (isNaN(index))
                return interaction.reply({
                    content: "Failed to get selected item index from shop",
                    flags: "Ephemeral",
                });

            const item = this.items[index];
            if (!item)
                return interaction.reply({
                    content: "Failed to fetch item from ",
                });

            const user = await AppUser.fromID(interaction.user.id);
            await user.addItem(item).save();

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

            return interaction.reply({
                content: purchaseMessage,
                flags: "Ephemeral",
            });
        });

        return new ActionRowBuilder().addComponents(select).toJSON();
    }

    private async generateEmbed(): Promise<EmbedBuilder> {
        let fields: APIEmbedField[] = [];

        this.items.forEach((item, i) => {
            const flatModifiers = Object.entries(item.flatModifiers ?? {})
                .filter(([_, v]) => v !== 0)
                .map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`)
                .join(", ");

            const percentageModifiers = Object.entries(item.percentageModifiers ?? {})
                .filter(([_, v]) => v !== 0)
                .map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}%`)
                .join(", ");

            const modifiers = [flatModifiers, percentageModifiers].filter(Boolean).join(", ");

            fields.push({
                name: item.name.slice(0, 23),
                value: `\`\`\`Cost: ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}, Type: ${item.type ?? "???"}${modifiers ? `, Modifiers: ${modifiers}` : ""}\`\`\``,
                inline: true,
            });

            if (this.stock <= 4 && i % 2 === 0) fields.push({ name: "\u200B", value: "\u200B", inline: true });
        });

        return new EmbedBuilder()
            .setTitle("Shop")
            .setDescription("Items for sale!")
            .setColor("#A6F7CB")
            .setURL(Globals.LINK)
            .setFooter({ text: "Shop opened" })
            .setTimestamp()
            .addFields(fields.slice(0, 25));
    }
}
