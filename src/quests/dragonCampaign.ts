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

export default class DragonCampaignQuest extends Quest.Base {
    maxPlayers: number = 2;
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
    //SKILLPOINT, GOLD, XP, MESSAGE Villages, Message Dragon
    rewards: Map<string, number> = new Map<string, number>();
    STAT_KEYS: Array<keyof StatsModel> = Object.keys(this.dragonStats) as Array<
        keyof StatsModel
    >;
    private reset() {
        this.players = [];
        this.rewards = new Map<string, number>([
            ["Skillpoints", 0],
            ["Gold", 0],
            ["XP", 0],
            // ["Message Villages", 0],
            // ["Message Dragon", 0],
        ]);
        this.dragonStats = {
            strength: 0,
            agility: 0,
            charisma: 0,
            magicka: 0,
            stamina: 0,
            defense: 0,
            vitality: 0,
        };
        this.playersTotalStats = {
            strength: 0,
            agility: 0,
            charisma: 0,
            magicka: 0,
            stamina: 0,
            defense: 0,
            vitality: 0,
        };
    }

    private addToReward(reward: string, val: number) {
        this.rewards.set(reward, this.rewards.get(reward)! + val);
    }

    private saveRewardType(val: number) {
        console.log("Val: " + val);
        if (val > 20) {
            this.addToReward("Skillpoints", 1);
        } else if (val > 0.5) {
            this.addToReward("Gold", val * 5);
        } else if (val > 0) {
            this.addToReward("XP", val * 5);
        } else if (val < -2) {
            this.addToReward("Skillpoints", -1);
        } else if (val < -0.6) {
            this.addToReward("XP", val * 10);
        } else {
            this.addToReward("Gold", val * 10);
        }
    }

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (
            interaction.customId ===
            `#${this.generateUniqueButtonID()}_joinTheCampaign`
        ) {
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
                let msgRewards = "```fix\n";
                for (const reward of this.rewards) {
                    reward[1] = Math.max(0, reward[1]);
                    msgRewards += `${reward[0].padEnd(15, " ")}: ${reward[1].toFixed(2)}\n`;
                    if (reward[0] == "Skillpoints") {
                        for (const user of this.players) {
                            await DataBase.giveSkillpoints(user, reward[1]);
                        }
                    } else if (reward[0] == "XP") {
                        for (const user of this.players) {
                            await DataBase.giveXP(user, reward[1]);
                        }
                    } else if (reward[0] == "Gold") {
                        for (const user of this.players) {
                            await DataBase.giveGold(user, reward[1]);
                        }
                    }
                }
                msgRewards += "```";
                await interaction.followUp({
                    content: `${this.players.map((player) => player).join(", ")}\n Rewards:\n${msgRewards}`,
                });
                this.reset();
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
                value: this.players.map((player) => player).join(", "),
            })
            .addFields({
                name: "**Dragon |VS| Players **",
                value: statField,
            })
            .setFooter(this.footerText);

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
                    this.saveRewardType(
                        (playerVal / dragonVal) * Math.random(),
                    );
                } else {
                    this.saveRewardType(
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
                .setCustomId(
                    `#${this.generateUniqueButtonID()}_joinTheCampaign`,
                )
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

        this.reset();
        this.generateEndDate(1000 * 60 * 30);

        for (const statName of this.STAT_KEYS) {
            this.dragonStats[statName] = Math.random() * this.maxPlayers * 10;
        }
        const questMsg = await this.generateCampaignMessage();

        let msg = await questChannel.send({
            embeds: questMsg.embed,
            components: questMsg.components,
        });
    }
}
