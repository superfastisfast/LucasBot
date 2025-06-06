import { Command } from "@/command";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
    User as UserDiscord,
    type Client,
    type CommandInteraction,
} from "discord.js";
import FightGame from "./fight/fightGame";
const path = require("path");
import { getFightDisplayOptions } from "./fight/generateInfo";

export default class FightCommand extends Command {
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
        for (const [id, game] of this.games) {
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
        console.log("=============[1]=============");
        let currentGame: FightGame | undefined = this.isUserPartOfFight(
            interaction.user.id,
        );
        console.log("=============[2]=============");

        if (currentGame === undefined) {
            interaction.reply({
                content: "You are not part of any fight!",
                flags: "Ephemeral",
            });
            return true;
        }
        console.log("=============[3]=============");
        if (currentGame!.isValidCombatMovement(interaction.user.id)) {
            console.log("=============[3.1]=============");
            if (interaction.customId === currentGame.id + "#moveLeft") {
                console.log("=============[3.1.1]=============");
                currentGame!.movePlayer("left");
                interaction.update(currentGame!.getDisplayOptions());
                // interaction.editReply(getdis
                //     await getFightDisplayOptions(currentGame, "Moved left"),
                // );
            } else if (interaction.customId === currentGame.id + "#moveRight") {
                console.log("=============[3.1.2]=============");
                currentGame!.movePlayer("right");
                interaction.update(currentGame!.getDisplayOptions());
                // interaction.editReply(
                //     await getFightDisplayOptions(currentGame, "Moved right"),
                // );
            } else if (interaction.customId === currentGame.id + "#attack") {
                console.log("=============[3.1.3]=============");
                const actionInfo: string = currentGame!.playerAttack();
                interaction.update(currentGame!.getDisplayOptions());
                // interaction.editReply(
                // await getFightDisplayOptions(
                //     currentGame,
                //     "Attacked\n" + actionInfo,
                // ),
                // );
                if (currentGame!.getNextPlayer().currentHealth <= 0) {
                    this.games.delete(currentGame!.id);
                    return true;
                }
            } else if (interaction.customId === currentGame.id + "#flee") {
                console.log("=============[3.1.4]=============");
                if (currentGame!.playerFlee()) {
                    interaction.editReply({
                        content: `The fight is over! ${currentGame!.getCurrentPlayer().dbUser!.username} escaped!`,
                        components: [],
                    });
                    this.games.delete(currentGame!.id);
                } else {
                    interaction.update(currentGame!.getDisplayOptions());
                    // interaction.editReply(
                    //     await getFightDisplayOptions(
                    //         currentGame,
                    //         `${currentGame!.getCurrentPlayer().dbUser!.username} Failed to flee!`,
                    //     ),
                    // );
                }
            } else if (interaction.customId === currentGame.id + "#sleep") {
                console.log("=============[3.1.5]=============");
                const manaAndHealthGainedMsg = currentGame!.playerSleep();
                interaction.update(currentGame!.getDisplayOptions());
                // interaction.editReply(
                //     await getFightDisplayOptions(
                //         currentGame,
                //         manaAndHealthGainedMsg,
                //     ),
                // );
            } else if (interaction.customId === currentGame.id + "#end") {
                console.log("=============[3.1.6]=============");
                //TODO REMOVE TEST BUTTON
                interaction.reply({
                    content: `The fight was ended by ${interaction.user.username}.`,
                    components: [],
                });
                this.games.delete(currentGame!.id);
                return true;
            }

            console.log("=============[3.2]=============");
            currentGame!.nextTurn();
            return true;
        } else {
            console.log("=============[4]=============");
            if (interaction.customId === currentGame.id + "#acceptFight") {
                console.log("=============[4.1]=============");
                interaction.update(currentGame!.getDisplayOptions());
                currentGame.isActive = true;
                console.log("=============[4.2]=============");
                return true;
            } else if (
                interaction.customId ===
                currentGame.id + "#declineFight"
            ) {
                console.log("=============[4.6]=============");
                interaction.editReply({
                    content: `The fight was cancelled by ${interaction.user.username}.`,
                    components: [],
                });
                this.games.delete(currentGame!.id);
                return true;
            } else if (interaction.customId === currentGame.id + "#end") {
                console.log("=============[4.7]=============");
                //TODO REMOVE TEST BUTTON
                interaction.editReply({
                    content: `The fight was ended by ${interaction.user.username}.`,
                    components: [],
                });
                this.games.delete(currentGame!.id);
                return false;
            }
            console.log("=============[5]=============");
        }
        console.log("=============[6]=============");

        return false;
    }

    private InitiateFight(
        user1: UserDiscord | undefined,
        user2: UserDiscord | undefined,
        gameIndex: number,
    ) {
        const builder = new EmbedBuilder()
            .setTitle(
                `:crossed_swords: ${user1?.displayName} -VS- ${user2?.displayName} :crossed_swords:`,
            )
            .setDescription(`${user2} do you accept the fight?`)
            .setTimestamp();
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(gameIndex + "#acceptFight")
                .setLabel("Accept Fight")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(gameIndex + "#declineFight")
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
        let msg = this.InitiateFight(
            interaction.user,
            otherUser || "Unknown",
            newGame.id,
        );
        interaction.reply({
            embeds: msg.embeds,
            components: msg.components,
        });
        newGame.initGame(interaction.user.id);

        console.log("Games:", this.games.size);
    }
}
