import { type ButtonInteraction, type Message, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { Item } from "@/models/item";
import { AppUser } from "@/user";

export default class PackageQuest extends Quest.Base {
    public override buttons: AppButton[] = [
        new AppButton("Open it immediately", this.onPressOpen.bind(this)),
        new AppButton("Find the owner", this.onPressOwner.bind(this)),
        new AppButton("Sell it", this.onPressSell.bind(this)),
    ];

    public override async start(): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons);

        const embed = new EmbedBuilder()
            .setTitle("Mysterious Package")
            .setDescription("There is a small, unmarked package. What do you do?")
            .setColor("#C1A471")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1382015780383887360/MysteryBox.png?ex=68499dfe&is=68484c7e&hm=a0acba79ae199869576e87d66f3e834c31d389f707d6083a7199a1dd70100e60&",
            )
            .setURL(Quest.link);

        return await Quest.channel.send({
            embeds: [embed],
            components: actionRow,
        });
    }

    public override async end(): Promise<Quest.EndReturn> {
        return Quest.end(this.name);
    }

    private async onPressOpen(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        const item = await Item.getRandom();
        if (!item) return;
        const itemInfo: string = `${item.tag} worth ${item.cost} gold!`;

        await user.equipItem(item).save();

        const embed = new EmbedBuilder()
            .setTitle("Mysterious Package")
            .setDescription(`${user.discord} opened the package and found a ${itemInfo}`)
            .setColor("#C1A471")
            .setURL(Quest.link)
            .toJSON();

        this.message.edit({
            embeds: [embed],
        });

        this.end();
    }

    private async onPressOwner(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);
        const goldAmount = Math.floor(Math.random() * 50) + 25;

        await user.addGold(goldAmount).save();

        const embed = new EmbedBuilder()
            .setTitle("Mysterious Package")
            .setDescription(`${user.discord} found the owner of the package, and recived ${goldAmount} gold`)
            .setColor("#C1A471")
            .setURL(Quest.link)
            .toJSON();

        this.message.edit({
            embeds: [embed],
        });

        this.end();
    }

    private async onPressSell(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);
        const goldAmount = Math.floor(Math.random() * 100) + 5;

        await user.addGold(goldAmount).save();

        const embed = new EmbedBuilder()
            .setTitle("Mysterious Package")
            .setDescription(`${user.discord} found a buyer of the package, and recived ${goldAmount} gold`)
            .setColor("#C1A471")
            .setURL(Quest.link)
            .toJSON();

        this.message.edit({
            embeds: [embed],
        });

        this.end();
    }
}

//             `#${this.generateUniqueButtonID()}_findOwner`
//         ) {
//             await interaction.reply({
//                 content:
//                     "**" +
//                     interaction.member?.user.username +
//                     "**\n" +
//                     `You found the owner of the package, and recived 50 gold`,
//                 flags: "Ephemeral",
//             });
//             const user = await AppUser.fromID(interaction.user.id);
//             await user.addGold(50).save();
//             this.interactedPlayerId = interaction.user.id;
//             return true;
//         } else if (
//             interaction.customId === `#${this.generateUniqueButtonID()}_sell`
//         ) {
//             await interaction.reply({
//                 content:
//                     "**" +
//                     interaction.member?.user.username +
//                     "**\n" +
//                     `You sold the package, and recived 50 gold`,
//                 flags: "Ephemeral",
//             });
//             const user = await AppUser.fromID(interaction.user.id);
//             await user.addGold(50).save();
//             this.interactedPlayerId = interaction.user.id;
//             return true;
//         }

//         return false;
//     }
