import { Message, ButtonInteraction, EmbedBuilder, type ColorResolvable } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";
import { Globals } from "..";
import { Item } from "@/models/item";

export default class IllegalPartyQuest extends Quest.Base {
    public override buttons: AppButton[] = [new AppButton("Join", this.onPressJoin.bind(this))];
    public override maxTimeActiveMS: number = 1000 * 60 * 12;

    fee: number = Globals.random(10, 40);
    color: ColorResolvable | null = "#9F00FF";

    joined: string[] = [];

    endings: (() => void)[] = [this.endRefund.bind(this), this.endRandomGift.bind(this), this.endRizz.bind(this)];

    public override async start(): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons);

        const embed = new EmbedBuilder()
            .setTitle("Illegal Party")
            .setDescription(`There is an illegal party at the corner... what do you do?\nJoin fee ${this.fee}`)
            .setColor(this.color)
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1384541902501838878/MzEyNF82NDAuanBn.png?ex=6852cea1&is=68517d21&hm=3e5e59d697b4e0db69e1499509e1116a334a60315089bad17ccebd1a67dd5593&",
            )
            .setURL(Globals.LINK);

        const lobby = new EmbedBuilder().setTitle("Lobby").setDescription("No players have joined yet!").setColor(this.color).setURL(Globals.LINK);

        await Globals.CHANNEL.send({
            embeds: [embed],
        });
        return await Globals.CHANNEL.send({
            embeds: [lobby],
            components: actionRow,
        });
    }

    public override async end(): Promise<Quest.EndReturn> {
        if (this.joined && this.joined.length > 0) {
            const randomEnding = this.endings[Globals.random(0, this.endings.length - 1)];
            if (!randomEnding) this.endRefund();
            else randomEnding();
        } else {
            const embed = new EmbedBuilder().setTitle("Result").setDescription(`No one joined`).setColor(this.color).setURL(Globals.LINK);

            this.message.edit({
                embeds: [embed],
            });
        }

        return Quest.end(this.name);
    }

    private async onPressJoin(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);
        if (user.inventory.gold < this.fee) {
            await interaction.reply({
                content: `You do not have enough ${Globals.ATTRIBUTES.gold.emoji} to join the party...`,
                flags: "Ephemeral",
            });
            return;
        }
        await user.addGold(-this.fee).save();

        for (const index in this.joined) {
            if (user.discord.id == this.joined[index]) {
                await interaction.reply({
                    content: `You are already in the lobby!`,
                    flags: "Ephemeral",
                });
                return;
            }
        }

        this.joined.push(user.discord.id);
        await interaction.reply({
            content: `You joined the illegal party!`,
            flags: "Ephemeral",
        });

        let joinedPlayerString: string = "";

        for (const index in this.joined) joinedPlayerString += `${(await AppUser.fromID(this.joined[index]!)).discord}, `;

        const lobby = new EmbedBuilder()
            .setTitle("Lobby")
            .setDescription(`Players: ${joinedPlayerString}`)
            .setColor(this.color)
            .setURL(Globals.LINK)
            .toJSON();

        this.message.edit({
            embeds: [lobby],
        });
    }

    private async endRefund(): Promise<void> {
        for (const join of this.joined) {
            const user = await AppUser.fromID(join);

            await user.addGold(this.fee).save();
        }

        const fallbackEndMessages: string[] = [];

        const fallbackEndMessage = fallbackEndMessages[Globals.random(0, fallbackEndMessages.length - 1)];

        const embed = new EmbedBuilder()
            .setTitle("Result")
            .setDescription(`${fallbackEndMessage}\nEveryone got refunded their ${this.fee} ${Globals.ATTRIBUTES.gold.emoji}`)
            .setColor(this.color)
            .setURL(Globals.LINK);

        this.message.edit({
            embeds: [embed],
        });
    }

    private async endRandomGift(): Promise<void> {
        let winners: [AppUser, Item.Base | undefined][] = [];

        for (const join of this.joined) {
            const user = await AppUser.fromID(join);

            let item = Item.manager.getRandom();
            if (item && item.cost > this.fee * 5) item = Globals.random(0, 100) < 25 ? undefined : Item.manager.getRandom();

            if (item) await user.addItem(item).save();

            winners.push([user, item]);
        }

        let winnerString: string = "";
        winners.forEach(([user, item]) => {
            winnerString += `${user.discord} got a ${item ? `${item.name} ${Globals.ATTRIBUTES.items.emoji}` : "Nothing"} worth ${item ? `${item.cost} ${Globals.ATTRIBUTES.gold.emoji}` : "Nothing"}`;
        });

        const embed = new EmbedBuilder()
            .setTitle("Result")
            .setDescription(`Everyone got a gift ${Globals.ATTRIBUTES.items.emoji}!\n${winnerString}`)
            .setColor(this.color)
            .setURL(Globals.LINK);

        this.message.edit({
            embeds: [embed],
        });
    }

    private async endRizz(): Promise<void> {
        let rizzlers: [AppUser, number][] = [];

        for (const join of this.joined) {
            const user = await AppUser.fromID(join);

            if (!["l", "h", "q"].some((letter) => user.discord.username.toLowerCase().includes(letter))) continue;

            const rizz = Globals.random(1, 4) / 4;
            user.database.stats.charisma += rizz;
            rizzlers.push([user, rizz]);
        }

        let rizzlerString: string = "";
        rizzlers.forEach(([user, rizz]) => {
            const rizzMessages: string[] = [
                `${user.discord} gained +${rizz}`,
                `${user.discord} had ultra rizz, +${rizz}`,
                `${user.discord} had and still has MAD rizz, +${rizz}`,
            ];

            rizzlerString += rizzMessages[Globals.random(0, rizzMessages.length - 1)];
        });

        const embed = new EmbedBuilder()
            .setTitle("Result")
            .setDescription(
                `The party was hosted by the rizzler, which made some get some rizz ${Globals.ATTRIBUTES.charisma.emoji}!\n${rizzlerString !== "" ? rizzlerString : "No one here had any rizz"}`,
            )
            .setColor(this.color)
            .setURL(Globals.LINK);

        this.message.edit({
            embeds: [embed],
        });
    }
}
