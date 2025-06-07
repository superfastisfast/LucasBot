import { Command } from "@/command";
import { Item, type ItemDocument } from "@/models/item";
import { DataBase } from "@/models/user";
import ShopService from "@/services/shopService";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
    type Client,
    type CommandInteraction,
} from "discord.js";

export default class ShopCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("shop")
            .setDescription("view the store for epic itmes!")
            .toJSON();
    }

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        const availableItems = await ShopService.getActiveShopItems();
        for (const item of availableItems) {
            if (interaction.customId === interaction.user.id + item.name) {
                DataBase.giveGold(interaction.user.id, -item.cost);
                DataBase.applyItem(interaction.user.id, item);
                interaction.reply({
                    content: `You bought and equipped ${item.name}.`,
                    components: [],
                    flags: "Ephemeral",
                });
                return true;
            }
        }
        return true;
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        const dbUser = DataBase.getDBUserFromUser(interaction.user.id);
        const validItems = await ShopService.getActiveShopItems();

        const shopEmbed = new EmbedBuilder()
            .setTitle("SHOP")
            .setDescription("\n")
            .setTimestamp();
        if (validItems.length > 0) {
            validItems.forEach((item) => {
                shopEmbed.addFields({
                    name: "",
                    value: `${Item.getStringCollection([item])}`,
                    inline: true,
                });
            });
        } else {
            shopEmbed.addFields({
                name: "Available Items",
                value: "No items currently available.",
                inline: false,
            });
        }

        const actionRow = new ActionRowBuilder<ButtonBuilder>();
        for (const item of validItems) {
            const cannotAffordButtonEnabled: boolean =
                (await dbUser).inventory.gold < item.cost ? true : false;
            const button = new ButtonBuilder()
                .setCustomId(interaction.user.id + item.name)
                .setLabel(`${item.name} (${item.cost} Gold)`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(cannotAffordButtonEnabled);
            actionRow.addComponents(button);
        }

        interaction.reply({
            embeds: [shopEmbed],
            components: [actionRow],
            flags: "Ephemeral",
        });
    }
}
