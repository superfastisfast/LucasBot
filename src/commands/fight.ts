import { Command } from "@/command";
import { getUserFromId } from "@/models/user";
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

//TODO list of active fights; Becaouse otherwise there is only one running.
export default class FightCommand extends Command {
    game?: FightGame;

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
        if (this.game?.getDiscordUserById(interaction.user.id) === undefined) {
            interaction.reply({
                content: "You are not part of this fight!",
                flags: "Ephemeral",
            });
            return true;
        }
        if (this.game!.isValidCombatMovement(interaction.user.id)) {
            if (interaction.customId === "#moveLeft") {
                this.game!.movePlayer("left");
                interaction.update(
                    await this.getFightDisplayOptions("Moved left"),
                );
            } else if (interaction.customId === "#moveRight") {
                this.game!.movePlayer("right");
                interaction.update(
                    await this.getFightDisplayOptions("Moved right"),
                );
            } else if (interaction.customId === "#attack") {
                const actionInfo: string = this.game!.playerAttack();
                interaction.update(
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
                    interaction.update({
                        content: `The fight is over! ${this.game!.getCurrentPlayer().dbUser!.username} escaped!`,
                        components: [],
                    });
                    this.game!.resetGame();
                } else {
                    interaction.update(
                        await this.getFightDisplayOptions(
                            `${this.game!.getCurrentPlayer().dbUser!.username} Failed to flee!`,
                        ),
                    );
                }
            } else if (interaction.customId === "#sleep") {
                const manaAndHealthGainedMsg = this.game!.playerSleep();
                interaction.update(
                    await this.getFightDisplayOptions(manaAndHealthGainedMsg),
                );
            }
            this.game!.nextTurn();
            return true;
        } else {
            if (interaction.customId === "#acceptFight") {
                const res = await this.game!.initGame(interaction.user.id);
                if (res.success) {
                    await interaction.update(
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
                interaction.update({
                    content: `The fight was cancelled by ${interaction.user.username}.`,
                    components: [],
                });
                this.game!.resetGame();
                return true;
            } else if (interaction.customId === "#end") {
                //TODO REMOVE TEST BUTTON
                interaction.update({
                    content: `The fight was ended by ${interaction.user.username}.`,
                    components: [],
                });
                this.game!.resetGame();
                return false;
            }
        }
        return false;
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
        const player1HealthBar = await this.createStatBar(
            this.game!.getPlayers()[0]!.currentHealth,
            this.game!.getPlayers()[0]!.getMaxHealthStats(),
            this.game!.getPlayers()[0]!.getMaxHealthStats(),
            "31",
        );
        const player1ManaBar = await this.createStatBar(
            this.game!.getPlayers()[0]!.currentMana,
            this.game!.getPlayers()[0]!.getMaxManaStats(),
            this.game!.getPlayers()[0]!.getMaxManaStats(),
            "34",
        );
        const player2HealthBar = await this.createStatBar(
            this.game!.getPlayers()[1]!.currentHealth,
            this.game!.getPlayers()[1]!.getMaxHealthStats(),
            this.game!.getPlayers()[1]!.getMaxHealthStats(),
            "31",
        );
        const player2ManaBar = await this.createStatBar(
            this.game!.getPlayers()[1]!.currentMana,
            this.game!.getPlayers()[1]!.getMaxManaStats(),
            this.game!.getPlayers()[1]!.getMaxManaStats(),
            "34",
        );
        const fieldImageAttachment = await getFieldImage(
            this.game!.getPlayers(),
            this.game!.arenaSize,
        );
        const builder = new EmbedBuilder()
            .setTitle(
                ":crossed_swords:" +
                    this.game!.getPlayers()[0]!.dbUser!.username +
                    " -VS- " +
                    this.game!.getPlayers()[1]!.dbUser!.username +
                    ":crossed_swords:",
            )
            .setDescription(currentPlayer.dbUser?.username + ": " + action)
            .setImage("attachment://game-field.png")
            .addFields(
                // Player 1 Stats
                {
                    name: `${this.game!.getPlayers()[0]!.dbUser!.username}'s Status`,
                    value:
                        `❤️ Health: ${player1HealthBar}\n` +
                        `🔵 Mana: ${player1ManaBar}\n` +
                        `⚔️ Strength: **${this.game!.getPlayers()[0]!.dbUser!.strength}**\n` +
                        `🛡️ Defense: **${this.game!.getPlayers()[0]!.dbUser!.defense}**\n` +
                        `🏃 Agility: **${this.game!.getPlayers()[0]!.dbUser!.agility}** \n` +
                        `✨ Magicka: **${this.game!.getPlayers()[0]!.dbUser!.magicka}**\n` +
                        `🔋 Vitality: **${this.game!.getPlayers()[0]!.dbUser!.vitality}**\n` +
                        `🏃‍♂️ Stamina: **${this.game!.getPlayers()[0]!.dbUser!.stamina}**\n` +
                        `🗣️ Charisma: **${this.game!.getPlayers()[0]!.dbUser!.charisma}**`,
                    inline: true,
                },
                // Player 2 Stats
                {
                    name: `${this.game!.getPlayers()[1]!.dbUser!.username}'s Status`,
                    value:
                        `❤️ Health: ${player2HealthBar}\n` +
                        `🔵 Mana: ${player2ManaBar}\n` +
                        `⚔️ Strength: **${this.game!.getPlayers()[1]!.dbUser!.strength}**\n` +
                        `🛡️ Defense: **${this.game!.getPlayers()[1]!.dbUser!.defense}**\n` +
                        `🏃 Agility: **${this.game!.getPlayers()[1]!.dbUser!.agility}**\n` +
                        `✨ Magicka: **${this.game!.getPlayers()[1]!.dbUser!.magicka}**\n` +
                        `🔋 Vitality: **${this.game!.getPlayers()[1]!.dbUser!.vitality}**\n` +
                        `🏃‍♂️ Stamina: **${this.game!.getPlayers()[1]!.dbUser!.stamina}**\n` +
                        `🗣️ Charisma: **${this.game!.getPlayers()[1]!.dbUser!.charisma}**`,
                    inline: true,
                },
            )
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
