import { Message, type ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";
import { Item, type ItemDocument } from "@/models/item";

export default class ShopQuest extends Quest.Base {
    public override buttons: AppButton[] = [];

    stock: number = 0;
    maxStock: number = 9;
    minStock: number = 2;

    public override async start(): Promise<Message<true>> {
        const embed = new EmbedBuilder()
            .setTitle("Shop")
            .setDescription("Come and buy some items!")
            .setColor("#A6F7CB")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1383456027084718122/iu.png?ex=684edb54&is=684d89d4&hm=ff0c3a78138fbd296021b6cbc72c973ba9e4ff7e7d213c277694fce1726ac129&",
            )
            .setURL(Quest.link);

        const store = new EmbedBuilder()
            .setTitle("Items")
            .setDescription("The item's that are for sale today!")
            .setColor("#A6F7CB")
            .setURL(Quest.link);

        this.stock = Math.floor(Math.random() * (this.maxStock - this.minStock)) + this.minStock;

        for (let i: number = 0; i < this.stock; i++) {
            const item: ItemDocument = (await Item.getRandom())!;
            if (!item) {
                console.warn("Item is null");
                return Quest.channel.send("Something went wrong... concult a Adam");
            }

            let modifiers: string = "";
            if (item.flatStatModifiers.size! + item.percentageStatModifiers.size! !== 0) {
                modifiers = "Modifiers:\n";
                for (const [key, value] of Object.entries(item.flatStatModifiers ?? {})) {
                    if (value > 0) modifiers += `${key} **+${value}**,\n`;
                }
                modifiers += "\n";
                for (const [key, value] of Object.entries(item.percentageStatModifiers ?? {})) {
                    if (value > 0) modifiers += `${key} **+${value}%**,\n`;
                }
            }

            store.addFields({
                name: item.name,
                value: `Cost: ${item.cost} gold\n
                    Type: ${item.tag}\n
                    ${modifiers}`,
                inline: true,
            });
            if (this.stock <= 4 && i % 2 === 0) store.addFields({ name: "\u200B", value: "\u200B", inline: true });

            const button = new AppButton(
                item.name,
                function (interaction: ButtonInteraction) {
                    ShopQuest.buy(interaction, item);
                }.bind(this),
            );

            this.buttons.push(button);
        }

        const actionRow = AppButton.createActionRow(this.buttons, 3);

        await Quest.channel.send({
            embeds: [embed],
        });

        return await Quest.channel.send({
            embeds: [store],
            components: actionRow,
        });
    }

    private static async buy(interaction: ButtonInteraction, item: ItemDocument): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        const canBuy = user.database.inventory.gold >= item.cost;
        if (canBuy) await user.addGold(-item.cost).equipItem(item).save();

        const article = "aeiou".includes(item.name.at(0)!.toLowerCase()) ? "an" : "a";

        const embed = new EmbedBuilder()
            .setTitle(`Purchase of ${item.name}`)
            .setDescription(
                canBuy
                    ? `You bought ${article} ${item.name} for ${item.cost} gold!`
                    : `${user.database.inventory.gold} gold is not enough to buy ${article} ${item.name} for ${item.cost} gold`,
            )
            .setColor(canBuy ? "#A6F7CB" : "#e63946")
            .setURL(Quest.link);

        await interaction.reply({
            embeds: [embed],
            flags: "Ephemeral",
        });
    }
}
