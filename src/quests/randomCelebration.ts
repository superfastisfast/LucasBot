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
    goldReward: number = 1;
    questData: Quest.Data = {
        title: "Random Celebration",
        imageUrl:
            "https://cdn.discordapp.com/attachments/1379101132743250082/1381989461734461572/party.png?ex=6849857b&is=684833fb&hm=fc43bbf72ac8d6f738251d7b2171851e0db2f7b00eb06ae5f46e9320fb4f77f6&",
        description: `Happy Random celebration! Everyone gains ${this.goldReward} gold :D`,
    };
    public override async startQuest(client: Client): Promise<void> {
        this.generateEndDate(0);
        this.generateFooter();
        if (!process.env.QUEST_CHANNEL_ID)
            throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        let questChannel: TextChannel = (await client.channels.fetch(
            process.env.QUEST_CHANNEL_ID,
        )) as TextChannel;

        const builder = new EmbedBuilder()
            .setTitle(this.questData.title)
            .setDescription(this.questData.description)
            .setColor("#0099ff")
            .setImage(this.questData.imageUrl)
            .setURL("https://www.youtube.com/@LucasDevelop")
            .setFooter(this.footerText);

        const guildId = questChannel.guild.id;
        const guild: Guild | undefined = await client.guilds.fetch(guildId);
        const members = await guild.members.fetch();

        for (const user of members) {
            DataBase.giveGold(user[1].user, this.goldReward);
        }

        let msg = await questChannel.send({
            embeds: [builder],
        });
    }
}
