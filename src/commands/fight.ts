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
} from "discord.js";
import FightGame from "./fight/fightGame";

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
        //TODO Verify Undefined?
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
                interaction.update(this.getFightDisplayOptions("Moved left"));
            } else if (interaction.customId === "#moveRight") {
                this.game!.movePlayer("right");
                interaction.update(this.getFightDisplayOptions("Moved right"));
            } else if (interaction.customId === "#attack") {
                const actionInfo: string = this.game!.playerAttack();
                interaction.update(
                    this.getFightDisplayOptions("Attacked\n" + actionInfo),
                );
            } else if (interaction.customId === "#flee") {
                if (this.game!.playerFlee()) {
                    interaction.update({
                        content: `The fight is over! ${this.game!.getCurrentPlayer().dbUser!.username} escaped!`,
                        components: [],
                    });
                    this.game!.resetGame();
                } else {
                    interaction.update(
                        this.getFightDisplayOptions(
                            `${this.game!.getCurrentPlayer().dbUser!.username} Failed to flee!`,
                        ),
                    );
                }
            }
            this.game!.nextTurn();
            return true;
        } else {
            if (interaction.customId === "#acceptFight") {
                const res = await this.game!.initGame(interaction.user.id);
                if (res.success) {
                    await interaction.update(
                        this.getFightDisplayOptions(res.reason),
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

    async createHealthBar(
        current: number,
        max: number,
        length: number = 10,
    ): Promise<string> {
        if (max <= 0) return "[:red_square:]";
        const percentage = current / max;
        const filled = Math.round(length * percentage);
        const empty = length - filled;
        const filledBar = "█".repeat(filled);
        const emptyBar = " ".repeat(empty);
        // Using ANSI code block for better visual consistency of the bar
        return `\`\`\`ansi\n[2;31m${filledBar}[0m[2;37m${emptyBar}[0m\n\`\`\` ${current.toFixed(2)}/${max.toFixed(2)}`;
    }

    private getFightDisplayOptions(action: string) {
        let fieldArray: string[] = Array(this.game!.arenaSize).fill("🔳");
        const currentPlayer = this.game!.getCurrentPlayer();
        const nextPlayer = this.game!.getNextPlayer();
        fieldArray[this.game!.getPlayers()[0]!.posX] = ":person_bald:";
        fieldArray[this.game!.getPlayers()[1]!.posX] = ":smirk_cat:";
        const player1HealthBar = this.createHealthBar(
            this.game!.getPlayers()[0]!.currentHealth,
            this.game!.getPlayers()[0]!.getMaxHealthStats(),
        );
        const player2HealthBar = this.createHealthBar(
            this.game!.getPlayers()[1]!.currentHealth,
            this.game!.getPlayers()[1]!.getMaxHealthStats(),
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
            .addFields(
                {
                    name: "Field",
                    value: fieldArray.join(""),
                    inline: false,
                },
                // Player 1 Stats
                {
                    name: `${this.game!.getPlayers()[0]!.dbUser!.username}'s Status`,
                    value:
                        `❤️ Health: ${player1HealthBar}\n` +
                        `⚔️ Strength: **${this.game!.getPlayers()[0]!.dbUser!.strength}**\n` +
                        `🛡️ Defense: **${this.game!.getPlayers()[0]!.dbUser!.defense}**\n` +
                        `🏃 Agility: **${this.game!.getPlayers()[0]!.dbUser!.agility}** \n` +
                        `✨ Magicka: **${this.game!.getPlayers()[0]!.dbUser!.magicka}**\n` +
                        `🔋 Stamina: **${this.game!.getPlayers()[0]!.dbUser!.stamina}**\n` +
                        `🗣️ Charisma: **${this.game!.getPlayers()[0]!.dbUser!.charisma}**`,
                    inline: true,
                },
                // Player 2 Stats
                {
                    name: `${this.game!.getPlayers()[1]!.dbUser!.username}'s Status`,
                    value:
                        `❤️ Health: ${player2HealthBar}\n` +
                        `⚔️ Strength: **${this.game!.getPlayers()[1]!.dbUser!.strength}**\n` +
                        `🛡️ Defense: **${this.game!.getPlayers()[1]!.dbUser!.defense}**\n` +
                        `🏃 Agility: **${this.game!.getPlayers()[1]!.dbUser!.agility}**\n` +
                        `✨ Magicka: **${this.game!.getPlayers()[1]!.dbUser!.magicka}**\n` +
                        `🔋 Stamina: **${this.game!.getPlayers()[1]!.dbUser!.stamina}**\n` +
                        `🗣️ Charisma: **${this.game!.getPlayers()[1]!.dbUser!.charisma}**`,
                    inline: true,
                },
            )
            .setFooter({
                text: `➡️ It's ${nextPlayer.dbUser!.username}'s Turn!`,
                iconURL: nextPlayer.imgeUrl,
            })
            .setTimestamp();
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            nextPlayer.posX === 0
                ? new ButtonBuilder()
                      .setCustomId("#flee")
                      .setLabel("Flee")
                      .setStyle(ButtonStyle.Danger)
                : new ButtonBuilder()
                      .setCustomId("#moveLeft")
                      .setLabel("<<<")
                      .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("#attack")
                .setLabel("Attack")
                .setStyle(ButtonStyle.Primary),
            nextPlayer.posX === this.game!.arenaSize - 1
                ? new ButtonBuilder()
                      .setCustomId("#flee")
                      .setLabel("Flee")
                      .setStyle(ButtonStyle.Danger)
                : new ButtonBuilder()
                      .setCustomId("#moveRight")
                      .setLabel(">>>")
                      .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("#end")
                .setLabel("End Fight (TEST)")
                .setStyle(ButtonStyle.Primary),
        );

        return {
            embeds: [builder],
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
