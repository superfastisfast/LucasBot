import { DataBase, StatsModel, type IStats } from "@/models/user";
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

export default class DragonCampaignQuest extends Quest {
    maxPlayers: number = 10;
    players: Array<User> = [];
    dragonStats: StatsModel = {
        strength: 0,
        agility: 0,
        charisma: 0,
        magicka: 0,
        stamina: 0,
        defense: 0,
        vitality: 0,
    };
    playersTotalStats: StatsModel = {
        strength: 0,
        agility: 0,
        charisma: 0,
        magicka: 0,
        stamina: 0,
        defense: 0,
        vitality: 0,
    };
    rewards: Array<number> = [];
    STAT_KEYS: Array<keyof StatsModel> = Object.keys(this.dragonStats) as Array<
        keyof StatsModel
    >;

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (interaction.customId === `${this.fileName}#joinTheCampaign`) {
            if (this.players.length >= this.maxPlayers) {
                await interaction.reply({
                    content: "Lobby is full!",
                    flags: "Ephemeral",
                });
                return true;
            }
            this.players.push(interaction.user);
            const dbUser = await DataBase.getDBUserFromUser(interaction.user);

            for (const statName of this.STAT_KEYS) {
                this.playersTotalStats[statName] += dbUser.stats[statName];
            }

            const questMsg = await this.generateCampaignMessage();
            await interaction.update({
                embeds: questMsg.embed,
                components: questMsg.components,
            });
            if (this.players.length >= this.maxPlayers) {
                await interaction.followUp({
                    content: "Reward: \n" + this.rewards.join("\n"),
                });
            }
            return true;
        }

        return false;
    }

    private async generateCampaignMessage() {
        const questData = await this.getQuestData();

        const dragonDisplayStats = DataBase.getDisplayStats(this.dragonStats!);
        const playersDisplayStats = DataBase.getDisplayStats(
            this.playersTotalStats!,
        );

        let maxDragonStatValueLength = 0;
        for (const index in dragonDisplayStats) {
            const dragonStatValue = `${dragonDisplayStats[index]![1]}`;

            maxDragonStatValueLength = Math.max(
                maxDragonStatValueLength,
                dragonStatValue.length,
            );
        }

        const PADDING_BUFFER = 2;
        maxDragonStatValueLength += PADDING_BUFFER;

        let statField = "```fix\n";
        for (const index in dragonDisplayStats) {
            statField += `${dragonDisplayStats[index]![0]}${(dragonDisplayStats[index]![1] + ":").padEnd(maxDragonStatValueLength, " ")}${dragonDisplayStats[index]![2].toFixed(2)} |VS| ${playersDisplayStats[index]![2].toFixed(2)}\n`;
        }
        statField += "```";

        const builder = new EmbedBuilder()
            .setTitle(questData.title)
            .setDescription(questData.description.replace(/\\n/g, "\n"))
            .setColor("#0099ff")
            .setThumbnail(questData.imageUrl)
            .addFields({
                name: `**Players: **(${this.players.length}/${this.maxPlayers})`,
                value: this.players.map((player) => player.username).join(", "),
            })
            .addFields({
                name: "**Dragon |VS| Players **",
                value: statField,
            })
            .setFooter({ text: "Quest Footer" })
            .setTimestamp();

        let enableButton: boolean = false;
        if (this.players.length >= this.maxPlayers) {
            let resultField = "```fix\n";
            for (const index in dragonDisplayStats) {
                const dragonRandom = Math.random();
                const playersRandom = Math.random();
                const dragonVal = dragonRandom * dragonDisplayStats[index]![2];
                const playerVal =
                    playersRandom * playersDisplayStats[index]![2];
                resultField += `${dragonDisplayStats[index]![0]}${(dragonDisplayStats[index]![1] + ":").padEnd(maxDragonStatValueLength, " ")}${dragonVal.toFixed(2)} |VS| ${playerVal.toFixed(2)}`;
                if (dragonVal < playerVal) {
                    this.rewards.push((playerVal / dragonVal) * Math.random());
                } else {
                    this.rewards.push(
                        -1 * (dragonVal / playerVal) * Math.random(),
                    );
                }
                resultField += `\t${dragonVal < playerVal ? "Won" : "Lost"}\n`;
            }
            resultField += "```";

            builder.addFields({
                name: "Game Results:",
                value: resultField,
            });
            enableButton = true;
        }
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`${this.fileName}#joinTheCampaign`)
                .setLabel("Join The Campaign")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(enableButton),
        );

        return { embed: [builder], components: [actionRow] };
    }

    public override async startQuest(client: Client): Promise<void> {
        let questChannel: TextChannel = (await client.channels.fetch(
            process.env.QUEST_CHANNEL_ID || "undefined",
        )) as TextChannel;

        for (const statName of this.STAT_KEYS) {
            this.dragonStats[statName] = Math.random() * 100;
        }
        const questMsg = await this.generateCampaignMessage();

        let msg = await questChannel.send({
            embeds: questMsg.embed,
            components: questMsg.components,
        });
    }
}
