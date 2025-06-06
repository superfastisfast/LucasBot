import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";
import type Fighter from "./fighter";

export const BLOCK_SIZE = 64;

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

export async function getFieldImage(players: Fighter[], arenaSize: number) {
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
    await addPlayerToConext(players[0]!, context);
    await addPlayerToConext(players[1]!, context);
    const buffer = await canvas.encode("png");
    const attachment = new AttachmentBuilder(buffer, {
        name: "game-field.png",
    });
    return attachment;
}
