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

export default class SubscribedQuest extends Quest.Base {
    questData: Quest.Data = {
        title: "subscribed",
        imageUrl:
            "https://cdn.discordapp.com/attachments/1379101132743250082/1379101169892327434/subscribe-7403560_1280.png?ex=683f038d&is=683db20d&hm=6e7deb8d64bc3a019f13547c0c16191322469c463211f937dd0486783c1c9529&",
        description: "are you subscribed to Lucas",
    };
    xpAmount = 10;
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
            let message = await interaction.reply(
                "**" +
                    interaction.member?.user.username +
                    "**" +
                    " Good 😊 \nYou gained " +
                    this.xpAmount +
                    "xp! Now tell a friend?",
            );
            this.interactedPlayerIds.push(interaction.user.id);
            const user = await AppUser.createFromID(interaction.user.id);
            user.addXP(this.xpAmount);
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
        this.generateEndDate(1000 * 60 * 10);
        this.generateFooter();
        this.interactedPlayerIds = [];
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
