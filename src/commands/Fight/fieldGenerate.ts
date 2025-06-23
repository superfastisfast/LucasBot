import type Fighter from "@/commands/Fight/fighter";
import type FightGame from "@/commands/Fight/fightGame";
import { Globals } from "@/index";
import { Item } from "@/models/item";
import { UserDB } from "@/models/user";
import type { AppUser } from "@/user";
import { createCanvas, Image, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { AttachmentBuilder, EmbedBuilder, type InteractionUpdateOptions } from "discord.js";

export const BLOCK_SIZE = 64;

async function addPlayerToConext(appUser: AppUser, context: SKRSContext2D, BorderImage: Image | undefined) {
    const playerAvatarUrl = appUser.discord.displayAvatarURL({
        extension: "png",
        size: BLOCK_SIZE,
    });
    const player: Fighter = appUser.fighter;
    let playerAvatar;
    try {
        playerAvatar = await loadImage(playerAvatarUrl);
        context.drawImage(playerAvatar, player.posX * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
        if (BorderImage !== undefined) {
            context.drawImage(BorderImage, player.posX * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
        }
    } catch (error) {
        console.error(`Failed to load player 1 avatar from ${playerAvatarUrl}:`, error);
        context.fillStyle = "red";
        context.fillRect(player.posX * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
        context.font = `${BLOCK_SIZE / 8}px sans-serif`;
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(appUser.database.username, player.posX * BLOCK_SIZE + BLOCK_SIZE / 2, BLOCK_SIZE / 2);
    }
}

export async function getFieldImage(currentGame: FightGame) {
    const FIELD_HEIGHT = BLOCK_SIZE;
    const FIELD_WIDTH = currentGame.arenaSize * BLOCK_SIZE;

    const canvas = createCanvas(FIELD_WIDTH, FIELD_HEIGHT);
    const context = canvas.getContext("2d");
    const squareBlockImagePath = "./assets/square.png";
    const borderImagePath = "./assets/border.png";

    let defaultBlockImage;
    try {
        defaultBlockImage = await loadImage(squareBlockImagePath);
    } catch (error) {
        console.error(`Failed to load square block image from ${squareBlockImagePath}:`, error);
        context.fillStyle = "#CCCCCC";
    }

    let BorderImage;
    try {
        BorderImage = await loadImage(borderImagePath);
    } catch (error) {
        console.error(`Failed to load square block image from ${borderImagePath}:`, error);
        context.fillStyle = "#BBBBBB";
    }

    for (let i = 0; i < currentGame.arenaSize; i++) {
        const x = i * BLOCK_SIZE;
        if (defaultBlockImage) {
            context.drawImage(defaultBlockImage, x, 0, BLOCK_SIZE, BLOCK_SIZE);
        } else {
            context.fillRect(x, 0, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
    const players: AppUser[] = currentGame.appUsers;
    await addPlayerToConext(players[0]!, context, currentGame.playerTurn === 1 ? BorderImage! : undefined);
    await addPlayerToConext(players[1]!, context, currentGame.playerTurn === 0 ? BorderImage! : undefined);
    const buffer = await canvas.encode("png");
    const attachment = new AttachmentBuilder(buffer, {
        name: "game-field.png",
    });
    return attachment;
}

export async function createStatBar(current: number, max: number, length: number = 10, filledColorCode: string = "31"): Promise<string> {
    if (max <= 0) return ":no_entry_sign: ";
    const percentage = current / max;
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    const filledBar = "█".repeat(filled);
    const emptyBar = " ".repeat(empty);
    // Using ANSI code block for better visual consistency of the bar
    return `${current.toFixed(2)}/${max.toFixed(2)}\`\`\`ansi\n[2;${filledColorCode}m${filledBar}[0m[2;37m${emptyBar}[0m\n\`\`\` `;
}

export async function getItemDisplay(player: Fighter) {
    const playerEquipedItems: string[] = (await player.appUser.getEquippedItems()).map(([bool, name]) => name);
    let items: Item.Base[] = Item.manager.findManyByNames(playerEquipedItems);
    let itemsDisplay = "";
    items.forEach((item, i) => {
        const flatModifiers = Object.entries(item.flatModifiers ?? {})
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => `${Globals.ATTRIBUTES[k as keyof typeof Globals.ATTRIBUTES].emoji} ${v > 0 ? "+" : ""}${v}`)
            .join(", ");

        const percentageModifiers = Object.entries(item.percentageModifiers ?? {})
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => `${Globals.ATTRIBUTES[k as keyof typeof Globals.ATTRIBUTES].emoji} ${v > 0 ? "+" : ""}${v * 100}%`)
            .join(", ");
        const modifiers = [flatModifiers, percentageModifiers].filter(Boolean).join("\n");

        itemsDisplay += `**${item.name}**\nType: ${item.type ?? "???"}${modifiers ? `\n${modifiers}` : ""}\n\n`;
    });

    return {
        name: `${player.appUser.discord.displayName}'s Itens`,
        value: `📦 Items: \n${itemsDisplay}\n`,
        inline: true,
    };
}

export async function getStatsDisplay(player: Fighter) {
    const statsData = UserDB.StatDB.keys.map((key) => ({
        name: Globals.ATTRIBUTES[key].name,
        emoji: Globals.ATTRIBUTES[key].emoji,
        value: player.appUser.database.stats[key],
    }));

    const maxNameLength = Math.max(...statsData.map((stat) => stat.name.length));

    const statString = statsData
        .map((stat) => {
            const padded = stat.name.padEnd(maxNameLength, " ");
            return `${stat.emoji} ${padded}: ${stat.value} + ${(player.appUser.getStat(stat.name.toLowerCase() as UserDB.StatDB.Type) - stat.value).toFixed(2)}`;
        })
        .join("\n");

    return {
        name: `${player.appUser.discord.displayName}'s Stats`,
        value: statString + "\n\n\n",
        inline: true,
    };
}

export async function getFightDisplay(currentGame: FightGame, action: string): Promise<InteractionUpdateOptions> {
    const currentPlayer = currentGame.getCurrentPlayer();
    const nextPlayer = currentGame.getNextPlayer();
    const player1 = currentGame.appUsers[0]!.fighter;
    const player2 = currentGame.appUsers[1]!.fighter;
    const player1HealthBar = await createStatBar(player1.currentHealth, player1.getMaxHealthStats(), player1.getMaxHealthStats(), "31");
    const player1ManaBar = await createStatBar(player1.currentMana, player1.getMaxManaStats(), player1.getMaxManaStats(), "34");
    const player2HealthBar = await createStatBar(player2.currentHealth, player2.getMaxHealthStats(), player2.getMaxHealthStats(), "31");
    const player2ManaBar = await createStatBar(player2.currentMana, player2.getMaxManaStats(), player2.getMaxManaStats(), "34");
    const player1ItemDisplay = await getItemDisplay(player1);
    const player2ItemDisplay = await getItemDisplay(player2);
    const player1StatsDisplay = await getStatsDisplay(player1);
    const player2StatsDisplay = await getStatsDisplay(player2);
    const fieldImageAttachment = await getFieldImage(currentGame);
    const builder = new EmbedBuilder()
        .setColor(0x0099ff)
        .setAuthor({
            name: `It's ${nextPlayer.appUser.discord.displayName}'s Turn!`,
            iconURL: nextPlayer.appUser.discord.avatarURL()!,
        })
        .setImage("attachment://game-field.png")
        .addFields(player1ItemDisplay, { name: "\u200B", value: "\u200B", inline: true }, player2ItemDisplay)
        .addFields(player1StatsDisplay, { name: "\u200B", value: "\u200B", inline: true }, player2StatsDisplay)
        .addFields(
            {
                name: "Health",
                value: player1HealthBar,
                inline: true,
            },
            { name: "\u200B", value: "\u200B", inline: true },
            {
                name: "Health",
                value: player2HealthBar,
                inline: true,
            },
        )
        .addFields(
            {
                name: "Mana",
                value: player1ManaBar,
                inline: true,
            },
            { name: "\u200B", value: "\u200B", inline: true },
            {
                name: "Mana",
                value: player2ManaBar,
                inline: true,
            },
        )
        .addFields({
            name: "\n**Action**",
            value: `${currentPlayer.appUser.discord.displayName} : ${action}`,
        })
        .setFooter({
            text: `➡️ It's ${nextPlayer.appUser.discord.displayName}'s Turn!`,
            iconURL: nextPlayer.appUser.discord.avatarURL()!,
        })
        .setTimestamp();

    return {
        embeds: [builder],
        files: [fieldImageAttachment],
    };
}
