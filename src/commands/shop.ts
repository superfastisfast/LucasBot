import { Command } from "@/command";
import { Item, type ItemDocument } from "@/models/item";
import ShopService from "@/services/shopService";
import { AppUser } from "@/user";
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
                await interaction.deferUpdate();
                const user = await AppUser.createFromID(interaction.user.id);
                let responseMsg = `**You need more money!**`;
                if (user.database.inventory.gold >= item.cost) {
                    responseMsg = `**You bought and equipped ${item.name}.**`;
                    await user
                        .addGold(-item.cost)
                        .equipItem(item)
                        .save();
                }

                const shopDisplay = this.generateShopDisplay(
                    user,
                    availableItems,
                );
                interaction.editReply({
                    content: responseMsg,
                    embeds: shopDisplay.embed,
                    components: shopDisplay.components,
                });
                return true;
            }
        }
        return false;
    }

    private generateShopDisplay(user: AppUser, items: ItemDocument[]) {
        const shopEmbed = new EmbedBuilder()
            .setTitle(`SHOP | Your Gold: ${user.database.inventory.gold}`)
            .setDescription("\n")
            .setTimestamp();
        if (items.length > 0) {
            items.forEach((item) => {
                shopEmbed.addFields({
                    name: "",
                    value: `${Item.getStringCollection([item])} \n\n`,
                    inline: false,
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
        for (const item of items) {
            const cannotAffordButtonEnabled: boolean =
                user.database.inventory.gold < item.cost ? true : false;
            const button = new ButtonBuilder()
                .setCustomId(user.discord.id + item.name)
                .setLabel(`${item.name} (${item.cost} Gold)`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(cannotAffordButtonEnabled);
            actionRow.addComponents(button);
        }
        return { embed: [shopEmbed], components: [actionRow] };
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        const user = await AppUser.createFromID(interaction.user.id);
        const validItems = await ShopService.getActiveShopItems();

        const shopInfo = this.generateShopDisplay(user, validItems);

        interaction.reply({
            embeds: shopInfo.embed,
            components: shopInfo.components,
            flags: "Ephemeral",
        });
    }
}
