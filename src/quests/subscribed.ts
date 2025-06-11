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

export default class SubscribedQuest extends Quest.Base {
    interactedPlayerIds: Array<string> = [];
    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (
            !interaction.user ||
            this.interactedPlayerIds.includes(interaction.user.id)
        )
            return false;
        if (interaction.customId === `#${this.generateUniqueButtonID()}_yes`) {
            const xpRecived = await DataBase.giveXP(interaction.user.id, 10);
            let message = await interaction.reply(
                "**" +
                    interaction.member?.user.username +
                    "**" +
                    " Good 😊 \nYou gained " +
                    xpRecived?.toFixed(2) +
                    "xp! Now tell a friend?",
            );
            this.interactedPlayerIds.push(interaction.user.id);
            return true;
        } else if (
            interaction.customId === `#${this.generateUniqueButtonID()}_no`
        ) {
            let message = await interaction.reply(
                "**" +
                    interaction.member?.user.username +
                    "**" +
                    " Yoooo wtf 💀, now tell a friend!",
            );
            this.interactedPlayerIds.push(interaction.user.id);
            return true;
        }

        return false;
    }

    public override async startQuest(client: Client): Promise<void> {
        const questData = await this.getQuestData();
        this.generateEndDate(1000 * 60 * 10);
        this.interactedPlayerIds = [];
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
            .setFooter(this.generateFooter());

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_yes`)
                .setLabel("YES")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_no`)
                .setLabel("NO")
                .setStyle(ButtonStyle.Primary),
        );

        let msg = await questChannel.send({
            embeds: [builder],
            components: [actionRow],
        });
    }
}
