import { Command } from "@/commands";
import {
    CommandInteraction,
    InteractionResponse,
    EmbedBuilder,
    ApplicationCommandOptionType,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    Events,
} from "discord.js";
import { AppUser } from "../user";
import { client, Globals } from "..";
import { ItemDB } from "@/models/item";

export default class ShopCommand extends Command.Base {
    // prettier-ignore
    public override main: Command.Command = new Command.Command(
        "shop", "Buy some cool items", 
        [],
        this.onExecute.bind(this),
    );

    itemAmount: number = 10;

    items: ItemDB.Document[] = [];

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        for (let i = 0; i < this.itemAmount; i++) {
            const item = await ItemDB.getRandom();
            if (item === null) {
                await interaction.reply({ content: "No items found", flags: "Ephemeral" });
                continue;
            }
            this.items.push(item);
        }

        const actionRow = this.handleItemOptions();
        const embed = await this.generateEmbed();

        return interaction.reply({
            embeds: [embed],
            components: [actionRow],
            flags: "Ephemeral",
        });
    }

    public handleItemOptions(): any {
        let options: StringSelectMenuOptionBuilder[] = [];

        this.items.forEach((item, i) => {
            const label = item.name;
            const value = `${i}_shop_item`;
            const description = `Cost: ${item.cost} gold`;

            options.push(
                new StringSelectMenuOptionBuilder().setLabel(label).setValue(value).setDescription(description),
            );
        });

        const select = new StringSelectMenuBuilder()
            .setCustomId("buy_items")
            .setPlaceholder("Choose an item to buy")
            .addOptions(options);

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
                `You now own a ${item.name} worth ${item.cost} gold.`,
                `Payment successful for ${item.name}, cost: ${item.cost} gold.`,
                `You've purchased ${item.name} for ${item.cost} gold. Nice choice!`,
                `Transaction complete! ${item.name} is yours for just ${item.cost} gold.`,
                `A shiny new ${item.name} has been added to your inventory. (${item.cost} gold spent)`,
                `Gold well spent! You bought ${item.name} for ${item.cost} gold.`,
                `You handed over ${item.cost} gold and received a ${item.name}. Fair trade.`,
                `Enjoy your new ${item.name}! It only cost you ${item.cost} gold.`,
                `You've successfully acquired ${item.name}. (${item.cost} gold deducted)`,
                `Cha-ching! ${item.name} is now yours for ${item.cost} gold.`,
                `The deal is done. ${item.name} is yours for ${item.cost} gold.`,
            ];

            const purchaseMessage: string =
                possiblePurchaseMessage[Globals.random(0, possiblePurchaseMessage.length - 1)]!;

            return interaction.reply({
                content: purchaseMessage,
                flags: "Ephemeral",
            });
        });

        return new ActionRowBuilder().addComponents(select).toJSON();
    }

    private async generateEmbed(): Promise<EmbedBuilder> {
        return new EmbedBuilder()
            .setTitle(`Shop`)
            .setDescription("Shop go brrr")
            .setColor("#A6F7CB")
            .setURL(Globals.LINK)
            .setFooter({ text: "Stats displayed" })
            .setTimestamp();
    }
}
