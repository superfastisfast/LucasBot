import { DataBase } from "@/models/user";
import { Quest } from "@/quest";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    User,
    type Client,
    type TextChannel,
} from "discord.js";

export default class SubscribedQuest extends Quest.Base {
    bet: number = 5;
    questData: Quest.Data = {
        title: "Red vs Blue",
        imageUrl:
            "https://cdn.discordapp.com/attachments/1379101132743250082/1382038199978688603/RedVsBlue.png?ex=6849b2df&is=6848615f&hm=bf4a2d2384a06f05254a556bc21afa61d7dc3ef327b0cb224dec387fb0650341&",
        description: `Pick a color cost ${this.bet} gold to participate. winners split the pool`,
    };
    // 0 = red, 1 = blue
    players: Array<Array<User>> = [];
    maxPlayers: number = 2;
    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (
            !interaction.user ||
            !this.players[0] ||
            !this.players[1] ||
            this.players[0].includes(interaction.user) ||
            this.players[1].includes(interaction.user)
        )
            return false;
        if (interaction.customId === `#${this.generateUniqueButtonID()}_red`) {
            await this.joinTeam(0, interaction);
            return true;
        } else if (
            interaction.customId === `#${this.generateUniqueButtonID()}_blue`
        ) {
            await this.joinTeam(1, interaction);
            return true;
        }
        return false;
    }
    private async joinTeam(team: number, interaction: ButtonInteraction) {
        const dbUser = await DataBase.getDBUserFromUser(interaction.user);
        if (dbUser.inventory.gold < this.bet) {
            interaction.reply({
                content: `You dont have ${this.bet} gold to bet!`,
                flags: "Ephemeral",
            });
            return;
        }
        this.players[team]!.push(interaction.user);
        await DataBase.giveGold(interaction.user, -this.bet);
        const questMsg = await this.generateQuestBody();
        interaction.update(questMsg);
        return;
    }
    private getTotalPlayers(): number {
        if (!this.players[0] || !this.players[1]) return 0;
        return this.players[0]?.length + this.players[1]?.length;
    }

    private async generateQuestBody() {
        const builder = new EmbedBuilder()
            .setTitle(this.questData.title)
            .setDescription(this.questData.description.replace(/\\n/g, "\n"))
            .setColor("#0099ff")
            .setImage(this.questData.imageUrl)
            .setURL("https://www.youtube.com/@LucasDevelop")
            .addFields({
                name: "Players",
                value: `Red: ${this.players[0]?.join(", ")} \nBlue: ${this.players[1]?.join(", ")}`,
            })
            .setFooter(this.footerText);
        const totplayer = this.getTotalPlayers();
        if (this.maxPlayers <= totplayer) {
            const winningTeamNumber: number = Math.random() > 0.5 ? 0 : 1;
            const winningTeam: string =
                winningTeamNumber === 0 ? "Red" : "Blue";
            const totplayers = this.getTotalPlayers();
            const perPlayerReward =
                (totplayers * this.bet) /
                this.players[winningTeamNumber]!.length;
            builder.addFields({
                name: "Winnning team: " + winningTeam,
                value: `Team won ${perPlayerReward} gold per player`,
            });
            for (const player of this.players[winningTeamNumber]!) {
                DataBase.giveGold(player, perPlayerReward);
            }
        }

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_red`)
                .setLabel("JOIN RED 🔴")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_blue`)
                .setLabel("JOIN BLUE 🔵")
                .setStyle(ButtonStyle.Primary),
        );
        return { embeds: [builder], components: [actionRow] };
    }

    public override async startQuest(client: Client): Promise<void> {
        this.generateEndDate(1000 * 60 * 10);
        this.generateFooter();
        this.players = [];
        this.players.push(new Array<User>());
        this.players.push(new Array<User>());
        if (!process.env.QUEST_CHANNEL_ID)
            throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        let questChannel: TextChannel = (await client.channels.fetch(
            process.env.QUEST_CHANNEL_ID,
        )) as TextChannel;

        const questMsg = await this.generateQuestBody();

        let msg = await questChannel.send({
            embeds: questMsg.embeds,
            components: questMsg.components,
        });
    }
}
