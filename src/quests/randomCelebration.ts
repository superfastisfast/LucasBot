import { DataBase } from "@/models/user";
import { Quest } from "@/quest";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    Guild,
    type Client,
    type TextChannel,
} from "discord.js";

export default class RandomCelebraion extends Quest.Base {
    public override async startQuest(client: Client): Promise<void> {
        const questData = await this.getQuestData();
        this.generateEndDate(0);
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

        const guildId = questChannel.guild.id;
        const guild: Guild | undefined = await client.guilds.fetch(guildId);
        const members = await guild.members.fetch();

        for (const user of members) {
            DataBase.giveGold(user[1].user, 1);
        }

        let msg = await questChannel.send({
            embeds: [builder],
        });
    }
}
