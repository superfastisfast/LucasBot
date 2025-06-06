import { Command } from "@/command";
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
        const shopEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("SHOP")
            .setDescription(
                "Welcome to the shop! Click a button to view an item or make a purchase.",
            )
            .setTimestamp();

        const shopItems = [
            {
                id: "item_sword",
                label: "Sword",
                price: 100,
                description: "A sharp sword!",
            },
            {
                id: "item_shield",
                label: "Shield",
                price: 75,
                description: "A sturdy shield!",
            },
            {
                id: "item_potion",
                label: "Potion",
                price: 50,
                description: "Restores health!",
            },
            {
                id: "item_armor",
                label: "Armor",
                price: 150,
                description: "Protective armor!",
            },
        ];

        const actionRow = new ActionRowBuilder<ButtonBuilder>();

        for (const item of shopItems) {
            const button = new ButtonBuilder()
                .setCustomId(item.id)
                .setLabel(`${item.label} ($${item.price})`)
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
