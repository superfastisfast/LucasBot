import { Item } from "@/models/item";
import { DataBase } from "@/models/user";
import { Quest } from "@/quest";
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
    interactedPlayerId: string = "";
    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (this.interactedPlayerId !== "") return false;
        if (interaction.customId === `#${this.generateUniqueButtonID()}_open`) {
            const item = await Item.getRandom();
            if (item) {
                await DataBase.userEquipItem(interaction.user, item);
                await interaction.reply(
                    "**" +
                        interaction.member?.user.username +
                        "**\n" +
                        `Opened a Mysterious Package and was forcefully equipped with` +
                        "\n" +
                        Item.getStringCollection([item]),
                );
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
        const questData = await this.getQuestData();
        this.generateEndDate(1000 * 60 * 10);
        this.interactedPlayerId = "";
        if (!process.env.QUEST_CHANNEL_ID)
            throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        let questChannel: TextChannel = (await client.channels.fetch(
            process.env.QUEST_CHANNEL_ID,
        )) as TextChannel;

        const builder = new EmbedBuilder()
            .setTitle(questData.title)
            .setDescription(questData.description.replace(/\\n/g, "\n"))
            .setColor("#0099ff")
            .setImage(questData.imageUrl)
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
