import { Command } from "@/command";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
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
    games?: Array<FightGame> = [];

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

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        for (const game in this.games as FightGame) {
            if (game.getDiscordUserById(interaction.user.id) === undefined) {
                interaction.reply({
                    content: "You are not part of this fight!",
                    flags: "Ephemeral",
                });
                return true;
            }
        }
        await interaction.deferUpdate();
        if (this.game!.isValidCombatMovement(interaction.user.id)) {
            if (interaction.customId === "#moveLeft") {
                this.game!.movePlayer("left");
                interaction.editReply(
                    await this.getFightDisplayOptions("Moved left"),
                );
            } else if (interaction.customId === "#moveRight") {
                this.game!.movePlayer("right");
                interaction.editReply(
                    await this.getFightDisplayOptions("Moved right"),
                );
            } else if (interaction.customId === "#attack") {
                const actionInfo: string = this.game!.playerAttack();
                interaction.editReply(
                    await this.getFightDisplayOptions(
                        "Attacked\n" + actionInfo,
                    ),
                );
                if (this.game!.getNextPlayer().currentHealth <= 0) {
                    this.game!.resetGame();
                    return true;
                }
            } else if (interaction.customId === "#flee") {
                if (this.game!.playerFlee()) {
                    interaction.editReply({
                        content: `The fight is over! ${this.game!.getCurrentPlayer().dbUser!.username} escaped!`,
                        components: [],
                    });
                    this.game!.resetGame();
                } else {
                    interaction.editReply(
                        await this.getFightDisplayOptions(
                            `${this.game!.getCurrentPlayer().dbUser!.username} Failed to flee!`,
                        ),
                    );
                }
            } else if (interaction.customId === "#sleep") {
                const manaAndHealthGainedMsg = this.game!.playerSleep();
                interaction.editReply(
                    await this.getFightDisplayOptions(manaAndHealthGainedMsg),
                );
            }
            this.game!.nextTurn();
            return true;
        } else {
            if (interaction.customId === "#acceptFight") {
                const res = await this.game!.initGame(interaction.user.id);
                if (res.success) {
                    await interaction.editReply(
                        await this.getFightDisplayOptions(res.reason),
                    );
                    this.game!.nextTurn();
                } else {
                    interaction.reply({
                        content: res.reason,
                        components: [],
                        flags: "Ephemeral",
                    });
                    return true;
                }
            } else if (interaction.customId === "#declineFight") {
                interaction.editReply({
                    content: `The fight was cancelled by ${interaction.user.username}.`,
                    components: [],
                });
                this.game!.resetGame();
                return true;
            } else if (interaction.customId === "#end") {
                //TODO REMOVE TEST BUTTON
                interaction.editReply({
                    content: `The fight was ended by ${interaction.user.username}.`,
                    components: [],
                });
                this.game!.resetGame();
                return false;
            }
        }
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
    ): Promise<InteractionUpdateOptions> {
        const currentPlayer = this.game!.getCurrentPlayer();
        const nextPlayer = this.game!.getNextPlayer();
        const player1 = this.game!.getPlayers()[0]!;
        const player2 = this.game!.getPlayers()[1]!;
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
            this.game!.getPlayers(),
            this.game!.arenaSize,
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
                      .setCustomId("#flee")
                      .setLabel("Flee")
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(allowActionsButtons)
                : new ButtonBuilder()
                      .setCustomId("#moveLeft")
                      .setLabel("<<<")
                      .setStyle(ButtonStyle.Primary)
                      .setDisabled(allowActionsButtons),
            new ButtonBuilder()
                .setCustomId("#attack")
                .setLabel("Attack")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(allowActionsButtons),
            nextPlayer.posX === this.game!.arenaSize - 1
                ? new ButtonBuilder()
                      .setCustomId("#flee")
                      .setLabel("Flee")
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(allowActionsButtons)
                : new ButtonBuilder()
                      .setCustomId("#moveRight")
                      .setLabel(">>>")
                      .setStyle(ButtonStyle.Primary)
                      .setDisabled(allowActionsButtons),
            new ButtonBuilder()
                .setCustomId("#sleep")
                .setLabel("sleep")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("#end")
                .setLabel("End Fight (TEST)")
                .setStyle(ButtonStyle.Primary),
        );

        return {
            embeds: [builder],
            files: [fieldImageAttachment],
            components: [actionRow],
        };
    }

    private InitiateFight(
        user1: string | undefined,
        user2: string | undefined,
    ) {
        const builder = new EmbedBuilder()
            .setTitle(
                ":crossed_swords:" +
                    user1 +
                    " -VS- " +
                    user2 +
                    ":crossed_swords:",
            )
            .setDescription(user2 + " do you accept the fight?")
            .setTimestamp();
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("#acceptFight")
                .setLabel("Accept Fight")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("#declineFight")
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

        if (this.game?.isActive) {
            interaction.reply({
                content: "A fight is already in progress!",
                flags: "Ephemeral",
            });
            return;
        }
        const otherUser =
            interaction.options.get("opponent")?.user || interaction.user;
        this.game = new FightGame(interaction.user, otherUser);
        let msg = this.InitiateFight(
            interaction.user.username,
            otherUser.username || "Unknown",
        );
        interaction.reply({
            embeds: msg.embeds,
            components: msg.components,
        });
    }
}
