import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    type InteractionUpdateOptions,
} from "discord.js";
import type Fighter from "./fighter";
import type FightGame from "./fightGame";

export const BLOCK_SIZE = 64;
interface PlayerDisplay {
    name: string;
    value: string;
    inline: boolean;
}

export function getPlayerDisplay(
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

export function createStatBar(
    current: number,
    max: number,
    length: number = 10,
    filledColorCode: string = "31",
): string {
    if (max <= 0) return ":no_entry_sign: ";
    const percentage = current / max;
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    const filledBar = "█".repeat(filled);
    const emptyBar = " ".repeat(empty);
    // Using ANSI code block for better visual consistency of the bar
    return `\`\`\`ansi\n[2;${filledColorCode}m${filledBar}[0m[2;37m${emptyBar}[0m\n\`\`\` ${current.toFixed(2)}/${max.toFixed(2)}`;
}

export function getFightDisplayOptions(currentGame: FightGame): EmbedBuilder {
    const currentPlayer = currentGame.getCurrentPlayer();
    const nextPlayer = currentGame.getNextPlayer();
    const player1 = currentGame.getPlayers()[0]!;
    const player2 = currentGame.getPlayers()[1]!;
    const player1HealthBar = createStatBar(
        player1.currentHealth,
        player1.getMaxHealthStats(),
        player1.getMaxHealthStats(),
        "31",
    );
    const player1ManaBar = createStatBar(
        player1.currentMana,
        player1.getMaxManaStats(),
        player1.getMaxManaStats(),
        "34",
    );
    const player2HealthBar = createStatBar(
        player2.currentHealth,
        player2.getMaxHealthStats(),
        player2.getMaxHealthStats(),
        "31",
    );
    const player2ManaBar = createStatBar(
        player2.currentMana,
        player2.getMaxManaStats(),
        player2.getMaxManaStats(),
        "34",
    );
    const player1DisplayStats = getPlayerDisplay(
        player1,
        player1HealthBar,
        player1ManaBar,
    );
    const player2DisplayStats = getPlayerDisplay(
        player2,
        player2HealthBar,
        player2ManaBar,
    );

    const builder = new EmbedBuilder()
        .setTitle(
            ":crossed_swords:" +
                player1.dbUser!.username +
                " -VS- " +
                player2.dbUser!.username +
                ":crossed_swords:",
        )
        .setDescription(
            currentPlayer.dbUser!.username + ": " + currentGame.action,
        )
        .setImage("attachment://game-field.png")
        .addFields(player1DisplayStats, player2DisplayStats)
        .setFooter({
            text: `➡️ It's ${nextPlayer.dbUser!.username}'s Turn!`,
            iconURL: nextPlayer.imgeUrl,
        })
        .setTimestamp();
    console.log("Playuer visual turn: " + currentGame.playerTurn);
    return builder;
}

async function addPlayerToConext(player: Fighter, context: SKRSContext2D) {
    const playerAvatarUrl = player.imgeUrl;
    let playerAvatar;
    try {
        playerAvatar = await loadImage(playerAvatarUrl);
        context.drawImage(
            playerAvatar,
            player.posX * BLOCK_SIZE,
            0,
            BLOCK_SIZE,
            BLOCK_SIZE,
        );
    } catch (error) {
        console.error(
            `Failed to load player 1 avatar from ${playerAvatarUrl}:`,
            error,
        );
        context.fillStyle = "red";
        context.fillRect(player.posX * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
        context.font = `${BLOCK_SIZE / 2}px sans-serif`;
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
            player.dbUser!.username,
            player.posX * BLOCK_SIZE + BLOCK_SIZE / 2,
            BLOCK_SIZE / 2,
        );
    }
}

export async function getFieldImage(
    player1: Fighter,
    player2: Fighter,
    arenaSize: number,
): Promise<AttachmentBuilder> {
    const FIELD_HEIGHT = BLOCK_SIZE;
    const FIELD_WIDTH = arenaSize * BLOCK_SIZE;

    const canvas = createCanvas(FIELD_WIDTH, FIELD_HEIGHT);
    const context = canvas.getContext("2d");
    const squareBlockImagePath = "./assets/square.png";

    let defaultBlockImage;
    try {
        defaultBlockImage = await loadImage(squareBlockImagePath);
    } catch (error) {
        console.error(
            `Failed to load square block image from ${squareBlockImagePath}:`,
            error,
        );
        context.fillStyle = "#CCCCCC";
    }

    for (let i = 0; i < arenaSize; i++) {
        const x = i * BLOCK_SIZE;
        if (defaultBlockImage) {
            context.drawImage(defaultBlockImage, x, 0, BLOCK_SIZE, BLOCK_SIZE);
        } else {
            context.fillRect(x, 0, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
    await addPlayerToConext(player1!, context);
    await addPlayerToConext(player2!, context);
    const buffer = await canvas.encode("png");
    const attachment = new AttachmentBuilder(buffer, {
        name: "game-field.png",
    });
    return attachment;
}

export function getButtons(
    nextPlayer: Fighter,
    currentGame: FightGame,
): ActionRowBuilder<ButtonBuilder> {
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
    return actionRow;
}
