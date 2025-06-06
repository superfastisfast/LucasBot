import { Command } from "@/command";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
    User,
    type Client,
    type CommandInteraction,
    type InteractionUpdateOptions,
} from "discord.js";
import FightGame from "./fight/fightGame";
import { getFieldImage } from "./fight/fieldGenerate";
import type Fighter from "./fight/fighter";

interface PlayerDisplay {
    name: string;
    value: string;
    inline: boolean;
}

export default class FightCommand extends Command {
    // game?: FightGame;
    games: Map<number, FightGame> = new Map<number, FightGame>();

    override get info(): any {
        console.log("Fight called");

        return new SlashCommandBuilder()
            .setName("fight")
            .setDescription("fight a player")
            .addUserOption((option) =>
                option
                    .setName("opponent")
                    .setDescription("The opponent to fight")
                    .setRequired(true),
            )
            .toJSON();
    }

    isUserPartOfFight(userId: string): FightGame | undefined {
        for (const [id, game] of this.games!) {
            if (game.getDiscordUserById(userId) !== undefined) {
                return game;
            }
        }
        return undefined;
    }

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        await interaction.deferUpdate();
        let currentGame: FightGame | undefined = this.isUserPartOfFight(
            interaction.user.id,
        );
        if (currentGame === undefined) {
            interaction.followUp({
                content: "You are not part of any fight!",
                flags: "Ephemeral",
            });
            return true;
        }
        console.log("=============[0]=============");
        if (currentGame.isValidCombatMovement(interaction.user.id)) {
            console.log("=============[1]=============");
            if (interaction.customId === currentGame.id + "#moveLeft") {
                currentGame.movePlayer("left");
                interaction.editReply(
                    await this.getFightDisplayOptions(
                        "Moved left",
                        currentGame,
                    ),
                );
            } else if (interaction.customId === currentGame.id + "#moveRight") {
                console.log("=============[2]=============");

                currentGame.movePlayer("right");
                interaction.editReply(
                    await this.getFightDisplayOptions(
                        "Moved right",
                        currentGame,
                    ),
                );
            } else if (interaction.customId === currentGame.id + "#attack") {
                console.log("=============[3]=============");

                const actionInfo: string = currentGame.playerAttack();
                interaction.editReply(
                    await this.getFightDisplayOptions(
                        "Attacked\n" + actionInfo,
                        currentGame,
                    ),
                );
                if (currentGame.getNextPlayer().currentHealth <= 0) {
                    currentGame.resetGame();
                    return true;
                }
            } else if (interaction.customId === currentGame.id + "#flee") {
                console.log("=============[4]=============");

                if (currentGame.playerFlee()) {
                    interaction.editReply({
                        content: `The fight is over! ${currentGame.getCurrentPlayer().dbUser!.username} escaped!`,
                        components: [],
                    });
                    currentGame.resetGame();
                } else {
                    interaction.editReply(
                        await this.getFightDisplayOptions(
                            `${currentGame.getCurrentPlayer().dbUser!.username} Failed to flee!`,
                            currentGame,
                        ),
                    );
                }
            } else if (interaction.customId === currentGame.id + "#sleep") {
                console.log("=============[5]=============");

                const manaAndHealthGainedMsg = currentGame.playerSleep();
                interaction.editReply(
                    await this.getFightDisplayOptions(
                        manaAndHealthGainedMsg,
                        currentGame,
                    ),
                );
            }
            currentGame.nextTurn();
            console.log("=============[-1]=============");

            return true;
        } else {
            if (interaction.customId === currentGame.id + "#acceptFight") {
                console.log("=============[6]=============");

                const res = await currentGame.initGame(interaction.user.id);
                if (res.success) {
                    await interaction.editReply(
                        await this.getFightDisplayOptions(
                            res.reason,
                            currentGame,
                        ),
                    );
                    currentGame.nextTurn();
                } else {
                    interaction.reply({
                        content: res.reason,
                        components: [],
                        flags: "Ephemeral",
                    });
                    return true;
                }
            } else if (
                interaction.customId ===
                currentGame.id + "#declineFight"
            ) {
                console.log("=============[7]=============");

                interaction.editReply({
                    content: `The fight was cancelled by ${interaction.user.username}.`,
                    components: [],
                });
                currentGame.resetGame();
                return true;
            } else if (interaction.customId === currentGame.id + "#end") {
                console.log("=============[8]=============");

                //TODO REMOVE TEST BUTTON
                interaction.editReply({
                    content: `The fight was ended by ${interaction.user.username}.`,
                    components: [],
                });
                currentGame.resetGame();
                return false;
            }
        }
        console.log("=============[-2]=============");

        return false;
    }

    getPlayerDisplay(
        player: Fighter,
        healthbar: string,
        manaBar: string,
    ): PlayerDisplay {
        return {
            name: `${player.dbUser!.username}'s Status`,
            value:
                `❤️ Health: ${healthbar}\n` +
                `🔵 Mana: ${manaBar}\n` +
                `⚔️ Strength: **${player.fighterStats.strength}**\n` +
                `🛡️ Defense: **${player.fighterStats.defense}**\n` +
                `🏃 Agility: **${player.fighterStats.agility}** \n` +
                `✨ Magicka: **${player.fighterStats.magicka}**\n` +
                `🔋 Vitality: **${player.fighterStats.vitality}**\n` +
                `🏃‍♂️ Stamina: **${player.fighterStats.stamina}**\n` +
                `🗣️ Charisma: **${player.fighterStats.charisma}**`,
            inline: true,
        };
    }

    async createStatBar(
        current: number,
        max: number,
        length: number = 10,
        filledColorCode: string = "31",
    ): Promise<string> {
        if (max <= 0) return ":no_entry_sign: ";
        const percentage = current / max;
        const filled = Math.round(length * percentage);
        const empty = length - filled;
        const filledBar = "█".repeat(filled);
        const emptyBar = " ".repeat(empty);
        // Using ANSI code block for better visual consistency of the bar
        return `\`\`\`ansi\n[2;${filledColorCode}m${filledBar}[0m[2;37m${emptyBar}[0m\n\`\`\` ${current.toFixed(2)}/${max.toFixed(2)}`;
    }

    private async getFightDisplayOptions(
        action: string,
        currentGame: FightGame,
    ): Promise<InteractionUpdateOptions> {
        const currentPlayer = currentGame.getCurrentPlayer();
        const nextPlayer = currentGame.getNextPlayer();
        const player1 = currentGame.getPlayers()[0]!;
        const player2 = currentGame.getPlayers()[1]!;
        const player1HealthBar = await this.createStatBar(
            player1.currentHealth,
            player1.getMaxHealthStats(),
            player1.getMaxHealthStats(),
            "31",
        );
        const player1ManaBar = await this.createStatBar(
            player1.currentMana,
            player1.getMaxManaStats(),
            player1.getMaxManaStats(),
            "34",
        );
        const player2HealthBar = await this.createStatBar(
            player2.currentHealth,
            player2.getMaxHealthStats(),
            player2.getMaxHealthStats(),
            "31",
        );
        const player2ManaBar = await this.createStatBar(
            player2.currentMana,
            player2.getMaxManaStats(),
            player2.getMaxManaStats(),
            "34",
        );
        const player1DisplayStats = this.getPlayerDisplay(
            player1,
            player1HealthBar,
            player1ManaBar,
        );
        const player2DisplayStats = this.getPlayerDisplay(
            player2,
            player2HealthBar,
            player2ManaBar,
        );
        const fieldImageAttachment = await getFieldImage(
            currentGame.getPlayers(),
            currentGame.arenaSize,
        );
        const builder = new EmbedBuilder()
            .setTitle(
                ":crossed_swords:" +
                    player1.dbUser!.username +
                    " -VS- " +
                    player2.dbUser!.username +
                    ":crossed_swords:",
            )
            .setDescription(currentPlayer.dbUser?.username + ": " + action)
            .setImage("attachment://game-field.png")
            .addFields(player1DisplayStats, player2DisplayStats)
            .setFooter({
                text: `➡️ It's ${nextPlayer.dbUser!.username}'s Turn!`,
                iconURL: nextPlayer.imgeUrl,
            })
            .setTimestamp();
        const allowActionsButtons = nextPlayer.currentMana < 1;
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            nextPlayer.posX === 0
                ? new ButtonBuilder()
                      .setCustomId(currentGame.id + "#flee")
                      .setLabel("Flee")
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(allowActionsButtons)
                : new ButtonBuilder()
                      .setCustomId(currentGame.id + "#moveLeft")
                      .setLabel("<<<")
                      .setStyle(ButtonStyle.Primary)
                      .setDisabled(allowActionsButtons),
            new ButtonBuilder()
                .setCustomId(currentGame.id + "#attack")
                .setLabel("Attack")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(allowActionsButtons),
            nextPlayer.posX === currentGame.arenaSize - 1
                ? new ButtonBuilder()
                      .setCustomId(currentGame.id + "#flee")
                      .setLabel("Flee")
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(allowActionsButtons)
                : new ButtonBuilder()
                      .setCustomId(currentGame.id + "#moveRight")
                      .setLabel(">>>")
                      .setStyle(ButtonStyle.Primary)
                      .setDisabled(allowActionsButtons),
            new ButtonBuilder()
                .setCustomId(currentGame.id + "#sleep")
                .setLabel("sleep")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(currentGame.id + "#end")
                .setLabel("End Fight (TEST)")
                .setStyle(ButtonStyle.Primary),
        );

        return {
            embeds: [builder],
            files: [fieldImageAttachment],
            components: [actionRow],
        };
    }

    private InitiateFight(user1: User, user2: User, gameId: number) {
        const builder = new EmbedBuilder()
            .setTitle(
                `:crossed_swords: ${user1?.displayName} -VS- ${user2?.displayName} :crossed_swords:`,
            )
            .setDescription(`${user2} do you accept the fight?`)
            .setTimestamp();
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(gameId + "#acceptFight")
                .setLabel("Accept Fight")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(gameId + "#declineFight")
                .setLabel("Decline Fight")
                .setStyle(ButtonStyle.Danger),
        );
        return {
            embeds: [builder],
            components: [actionRow],
        };
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        if (interaction.user === interaction.options.get("opponent")?.user) {
            interaction.reply({
                content: "You cannot fight yourself!",
                flags: "Ephemeral",
            });
            return;
        }

        const otherUser =
            interaction.options.get("opponent")?.user || interaction.user;
        if (this.isUserPartOfFight(interaction.user.id) !== undefined) {
            interaction.reply({
                content: "You are already in a fight!",
                flags: "Ephemeral",
            });
            return;
        }
        if (this.isUserPartOfFight(otherUser.id) !== undefined) {
            interaction.reply({
                content: `${otherUser.username} is already in a fight!`,
                flags: "Ephemeral",
            });
            return;
        }
        let newGame = new FightGame(interaction.user, otherUser);
        this.games.set(newGame.id, newGame);
        let msg = this.InitiateFight(interaction.user, otherUser, newGame.id);
        interaction.reply({
            embeds: msg.embeds,
            components: msg.components,
        });

        console.log("Games:", this.games.size);
    }
}
