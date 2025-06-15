import { type Client, Message, type ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";
import { Item, type ItemDocument } from "@/models/item";

export default class ShopQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map([
        ["Enter", new AppButton("Enter shop", this.onPressEnter.bind(this))],
    ]);

    items: ItemDocument[] = [];
    maxItemAmount: number = 10;

    public override async start(): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons, ["Enter"]);
        const embed = new EmbedBuilder()
            .setTitle("Shop")
            .setDescription("Come and buy some items!")
            .setColor("#A6F7CB")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1383456027084718122/iu.png?ex=684edb54&is=684d89d4&hm=ff0c3a78138fbd296021b6cbc72c973ba9e4ff7e7d213c277694fce1726ac129&",
            )
            .setURL(Quest.link)
            .toJSON();

        this.loadItems();

        return await Quest.channel.send({
            embeds: [embed],
            components: actionRow,
        });
    }

    private async loadItems(): Promise<void> {
        const N = Math.floor(Math.random() * this.maxItemAmount);
        for (let i = 0; i < N; i++) {
            const item = await Item.getRandom();
            if (!item) continue;

            this.items.push(item);
        }
    }

    private async onPressEnter(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        await interaction.reply({
            content: `Shop is under construction 🏗🚧`,
            flags: "Ephemeral",
        });
    }
}
