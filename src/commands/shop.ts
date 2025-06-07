import { Command } from "@/command";
import { Item, type ItemDocument } from "@/models/item";
import { DataBase } from "@/models/user";
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
        if (interaction.customId === interaction.user.id + "#buy") {
            interaction.reply({
                content: `The fight was ended by ${interaction.user.username}.`,
                components: [],
            });
            return true;
        }
        if (interaction.customId === interaction.user.id + "#sell") {
            interaction.reply({
                content: `The fight was ended by ${interaction.user.username}.`,
                components: [],
            });
            return true;
        }
        return true;
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        //TODO: providing items from a service that stores items for a limited time, then updates.
        let items: Array<ItemDocument | null> = [
            await Item.getFromName("Club"),
            await Item.getFromName("Leather Helmet"),
            await Item.getFromName("Leather Chestplate"),
        ];
        const validItems = items.filter(
            (item): item is ItemDocument => item !== null && item !== undefined,
        );

        const shopEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("SHOP")
            .setDescription(
                "Welcome to the shop! Click a button to view an item or make a purchase.",
            )
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
            const button = new ButtonBuilder()
                .setCustomId(interaction.user.id + item.name)
                .setLabel(`${item.name} (${item.cost} Gold)`)
                .setStyle(ButtonStyle.Primary);
            actionRow.addComponents(button);
        }
        interaction.reply({
            embeds: [shopEmbed],
            components: [actionRow],
            flags: "Ephemeral",
        });
    }
}
