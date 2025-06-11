import { Item } from "@/models/item";
import { DataBase } from "@/models/user";
import { Quest } from "@/quest";
import { AppUser } from "@/user";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    type Client,
    type TextChannel,
} from "discord.js";

export default class MysteriousPackage extends Quest.Base {
    questData: Quest.Data = {
        title: "Mysterious Package",
        imageUrl:
            "https://cdn.discordapp.com/attachments/1379101132743250082/1382015780383887360/MysteryBox.png?ex=68499dfe&is=68484c7e&hm=a0acba79ae199869576e87d66f3e834c31d389f707d6083a7199a1dd70100e60&",
        description: "There is a small, unmarked package. What do you do?",
    };
    interactedPlayerId: string = "";
    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (this.interactedPlayerId !== "") return false;
        if (interaction.customId === `#${this.generateUniqueButtonID()}_open`) {
            const item = await Item.getRandom();
            const itemInfo = item
                ? Item.getStringCollection([item])
                : "No Item";
            await interaction.reply(
                "**" +
                    interaction.member?.user.username +
                    "**\n" +
                    `Opened a Mysterious Package and was forcefully equipped with` +
                    "\n" +
                    itemInfo,
            );
            if (item) {
                const user = await AppUser.createFromID(interaction.user.id);
                await user.equipItem(item);
            }
            this.interactedPlayerId = interaction.user.id;
            return true;
        } else if (
            interaction.customId ===
            `#${this.generateUniqueButtonID()}_findOwner`
        ) {
            await interaction.reply({
                content:
                    "**" +
                    interaction.member?.user.username +
                    "**\n" +
                    `You found the owner of the package, and recived 50 gold`,
                flags: "Ephemeral",
            });
            DataBase.giveGold(interaction.user, 50);
            this.interactedPlayerId = interaction.user.id;
            return true;
        } else if (
            interaction.customId === `#${this.generateUniqueButtonID()}_sell`
        ) {
            await interaction.reply({
                content:
                    "**" +
                    interaction.member?.user.username +
                    "**\n" +
                    `You sold the package, and recived 50 gold`,
                flags: "Ephemeral",
            });
            DataBase.giveGold(interaction.user, 50);
            this.interactedPlayerId = interaction.user.id;
            return true;
        }

        return false;
    }

    public override async startQuest(client: Client): Promise<void> {
        this.generateEndDate(1000 * 60 * 10);
        this.generateFooter();
        this.interactedPlayerId = "";
        if (!process.env.QUEST_CHANNEL_ID)
            throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        let questChannel: TextChannel = (await client.channels.fetch(
            process.env.QUEST_CHANNEL_ID,
        )) as TextChannel;

        const builder = new EmbedBuilder()
            .setTitle(this.questData.title)
            .setDescription(this.questData.description.replace(/\\n/g, "\n"))
            .setColor("#0099ff")
            .setImage(this.questData.imageUrl)
            .setURL("https://www.youtube.com/@LucasDevelop")
            .setFooter(this.footerText);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_open`)
                .setLabel("Open it immediately")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_findOwner`)
                .setLabel("Find & Give To Owner")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_sell`)
                .setLabel("Sell it to the nearest vendor")
                .setStyle(ButtonStyle.Primary),
        );

        let msg = await questChannel.send({
            embeds: [builder],
            components: [actionRow],
        });
    }
}
