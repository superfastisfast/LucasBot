import { createCanvas, loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";

export async function generateFieldImage(){
    const BLOCK_SIZE = 64; 
    const FIELD_HEIGHT = BLOCK_SIZE;
    const FIELD_WIDTH = this.arenaSize * BLOCK_SIZE;

}



private async gene(action: string) { // Make this an async function


    const canvas = createCanvas(FIELD_WIDTH, FIELD_HEIGHT);
    const context = canvas.getContext('2d');

    // --- Load your background block image ---
    // You'll need to provide an actual path to your image file
    // For example, if you have an 'assets' folder with 'square_block.png'
    const squareBlockImagePath = './assets/square_block.png'; // <--- IMPORTANT: Adjust this path
    let defaultBlockImage;
    try {
        defaultBlockImage = await loadImage(squareBlockImagePath);
    } catch (error) {
        console.error(`Failed to load square block image from ${squareBlockImagePath}:`, error);
        // Fallback or handle error, perhaps draw a simple colored rectangle
        context.fillStyle = '#CCCCCC'; // Light grey fallback
    }

    // --- Draw the background for each segment of the field ---
    for (let i = 0; i < this.arenaSize; i++) {
        const x = i * BLOCK_SIZE;
        if (defaultBlockImage) {
            context.drawImage(defaultBlockImage, x, 0, BLOCK_SIZE, BLOCK_SIZE);
        } else {
            context.fillRect(x, 0, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
       // --- Overlay Player PFPs ---
    const player1 = this.players[0]!;
    const player2 = this.players[1]!;

    // Load player 1's avatar
    const player1AvatarUrl = player1.dbUser!.displayAvatarURL({ extension: 'png', size: BLOCK_SIZE });
    let player1Avatar;
    try {
        player1Avatar = await loadImage(player1AvatarUrl);
        context.drawImage(player1Avatar, player1.posX * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
    } catch (error) {
        console.error(`Failed to load player 1 avatar from ${player1AvatarUrl}:`, error);
        // Draw a fallback or placeholder for player 1
        context.fillStyle = 'red';
        context.fillRect(player1.posX * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
        context.font = `${BLOCK_SIZE / 2}px sans-serif`;
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('P1', player1.posX * BLOCK_SIZE + BLOCK_SIZE / 2, BLOCK_SIZE / 2);
    }


    // Load player 2's avatar
    const player2AvatarUrl = player2.dbUser!.displayAvatarURL({ extension: 'png', size: BLOCK_SIZE });
    let player2Avatar;
    try {
        player2Avatar = await loadImage(player2AvatarUrl);
        context.drawImage(player2Avatar, player2.posX * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
    } catch (error) {
        console.error(`Failed to load player 2 avatar from ${player2AvatarUrl}:`, error);
        // Draw a fallback or placeholder for player 2
        context.fillStyle = 'blue';
        context.fillRect(player2.posX * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
        context.font = `${BLOCK_SIZE / 2}px sans-serif`;
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('P2', player2.posX * BLOCK_SIZE + BLOCK_SIZE / 2, BLOCK_SIZE / 2);
    }


    // --- Create an AttachmentBuilder ---
    const buffer = await canvas.encode('png');
    const attachment = new AttachmentBuilder(buffer, { name: 'game-field.png' });


    const currentPlayer = this.players[this.playerTurn]!;
    const nextPlayer = this.players[this.playerTurn === 0 ? 1 : 0]!;
    const player1HealthBar = this.createHealthBar(
        this.players[0]!.currentHealth,
        this.players[0]!.getMaxHealthStats(),
    );
    const player2HealthBar = this.createHealthBar(
        this.players[1]!.currentHealth,
        this.players[1]!.getMaxHealthStats(),
    );
    const builder = new EmbedBuilder()
        .setTitle(
            ":crossed_swords:" +
            this.players[0]?.dbUser!.username +
            " -VS- " +
            this.players[1]?.dbUser!.username +
            ":crossed_swords:",
        )
        .setDescription(currentPlayer.dbUser?.username + ": " + action)
        // Set the generated image as the embed's image
        .setImage('attachment://game-field.png')
        .addFields(
            // Player 1 Stats
            {
                name: `${this.players[0]?.dbUser!.username}'s Status`,
                value:
                    `❤️ Health: ${player1HealthBar}\n` +
                    `⚔️ Strength: **${this.players[0]?.dbUser!.strength}**\n` +
                    `🛡️ Defense: **${this.players[0]?.dbUser!.defense}**\n` +
                    `🏃 Agility: **${this.players[0]?.dbUser!.agility}** \n` +
                    `✨ Magicka: **${this.players[0]?.dbUser!.magicka}**\n` +
                    `🔋 Stamina: **${this.players[0]?.dbUser!.stamina}**\n` +
                    `🗣️ Charisma: **${this.players[0]?.dbUser!.charisma}**`,
                inline: true,
            },
            // Player 2 Stats
            {
                name: `${this.players[1]?.dbUser!.username}'s Status`,
                value:
                    `❤️ Health: ${player2HealthBar}\n` +
                    `⚔️ Strength: **${this.players[1]?.dbUser!.strength}**\n` +
                    `🛡️ Defense: **${this.players[1]?.dbUser!.defense}**\n` +
                    `🏃 Agility: **${this.players[1]?.dbUser!.agility}**\n` +
                    `✨ Magicka: **${this.players[1]?.dbUser!.magicka}**\n` +
                    `🔋 Stamina: **${this.players[1]?.dbUser!.stamina}**\n` +
                    `🗣️ Charisma: **${this.players[1]?.dbUser!.charisma}**`,
                inline: true,
            },
        )
        .setFooter({
            text: `➡️ It's ${nextPlayer.dbUser!.username}'s Turn!`,
            iconURL: nextPlayer.imgeUrl,
        })
        .setTimestamp();

    return { embeds: [builder], files: [attachment] }; // Return the embed AND the attachment
}