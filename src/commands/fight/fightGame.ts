import { getUserFromId } from "@/models/user";
import Fighter from "./fighter";
import type {
    User as DiscordUser,
    AttachmentBuilder,
    InteractionUpdateOptions,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
} from "discord.js";
import {
    BLOCK_SIZE,
    getButtons,
    getFieldImage,
    getFightDisplayOptions,
} from "./generateInfo";
interface GameInitializationResult {
    success: boolean;
    reason: string;
}

export default class FightGame {
    isActive: boolean = false;
    players: Fighter[] = [];
    arenaSize: number = 6;
    playerTurn: number = 1;
    discordUsers: DiscordUser[] = [];

    builderOnfoDirty: boolean = true;
    builderInfo?: EmbedBuilder;
    action?: string;

    actionRowButtonsDirty: boolean = true;
    actionRowButtons?: ActionRowBuilder<ButtonBuilder>;

    fieldImageDirty: boolean = true;
    fieldImages: Array<AttachmentBuilder> = new Array(5).fill(null);
    fieldImageIndex: number = 0;

    private static nextId: number = 0;
    id: number = 0;

    constructor(discordUser1: DiscordUser, discordUser2: DiscordUser) {
        this.id = FightGame.nextId++;
        this.discordUsers = [discordUser1, discordUser2];
    }

    async initGame(id: string): Promise<GameInitializationResult> {
        const dbCommandUser = await getUserFromId(this.discordUsers[0]!.id);
        const dbOpponentUser = await getUserFromId(this.discordUsers[1]!.id);
        if (!dbCommandUser || !dbOpponentUser) {
            return {
                success: false,
                reason: "One or both users could not be found in the database.",
            };
        }
        this.players[0] = await Fighter.create(
            dbCommandUser,
            0,
            this.discordUsers[0]!.displayAvatarURL({
                extension: "png",
                size: BLOCK_SIZE,
            }),
        );
        this.players[1] = await Fighter.create(
            dbOpponentUser,
            this.arenaSize - 1,
            this.discordUsers[1]!.displayAvatarURL({
                extension: "png",
                size: BLOCK_SIZE,
            }),
        );
        this.fieldImages[0] = await getFieldImage(
            this.players[0],
            this.players[1],
            this.arenaSize,
        );
        // this.builderInfo = getFightDisplayOptions(this);
        // this.actionRowButtons = getButtons(this.getCurrentPlayer(), this);

        console.log("playerTurn" + this.playerTurn);

        //Need to do so inital visuals are correct
        this.playerTurn = 1;
        this.nextTurn();
        this.playerTurn = 0;

        return {
            success: true,
            reason: " Accepted the fight",
        };
    }

    validateTurn(id: string): boolean {
        if (this.playerTurn == 0 && id === this.players[0]?.dbUser!.id) {
            return true;
        } else if (this.playerTurn == 1 && id === this.players[1]?.dbUser!.id) {
            return true;
        }
        return false;
    }

    getDisplayOptions(): InteractionUpdateOptions {
        return {
            embeds: [this.builderInfo!],
            files: [this.fieldImages[this.fieldImageIndex]!],
            components: [this.actionRowButtons!],
        };
    }

    getPlayers(): Fighter[] {
        return this.players;
    }
    getDiscordUserById(id: string): DiscordUser | undefined {
        return this.discordUsers.find((player) => player.id === id);
    }
    isValidCombatMovement(playerId: string): boolean {
        return this.isActive && this.validateTurn(playerId);
    }
    getCurrentPlayer(): Fighter {
        return this.players[this.playerTurn]!;
    }
    getNextPlayer(): Fighter {
        return this.players[this.playerTurn === 0 ? 1 : 0]!;
    }
    movePlayer(direction: "left" | "right") {
        this.fieldImageDirty = true;
        const currentPlayer = this.getCurrentPlayer();
        if (direction === "left") {
            currentPlayer.move(-1, this.arenaSize - 1);
        } else if (direction === "right") {
            // this.fieldImageIndex = this.playerTurn
            currentPlayer.move(1, this.arenaSize - 1);
        }
        currentPlayer.drainMana(1);
    }
    playerAttack(): string {
        const currentPlayer = this.getCurrentPlayer();
        const opponent = this.getNextPlayer();
        currentPlayer.drainMana(1);
        const actionInfo: string = currentPlayer.attack(opponent);
        if (opponent.currentHealth <= 0) {
            return `${opponent.dbUser!.username} has been defeated!`;
        }
        return actionInfo;
    }
    playerFlee(): boolean {
        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.drainMana(1);
        return currentPlayer.fighterStats.agility / 100 > Math.random();
    }

    playerSleep(): string {
        const currentPlayer = this.getCurrentPlayer();
        console.log(`${currentPlayer.dbUser!.username} is trying to sleep...`);
        const healthToGain =
            Math.random() * (currentPlayer.fighterStats.vitality || 1);
        const manaToGain =
            (Math.random() * (currentPlayer.fighterStats.stamina || 1)) / 3 + 1;
        currentPlayer.gainHealth(healthToGain);
        currentPlayer.gainMana(manaToGain);
        return `rested and regained ${healthToGain.toFixed(2)} health and ${manaToGain.toFixed(2)} mana.`;
    }

    async nextTurn() {
        this.playerTurn = this.playerTurn === 0 ? 1 : 0;
        console.log("new player turn: " + this.playerTurn);
        let player1: Fighter = this.players[0]!;
        let player2: Fighter = this.players[1]!;

        player1.calculateStats();
        player2.calculateStats();

        if (this.fieldImageDirty) {
            const p1Pos: number = player1.posX;
            const p2Pos: number = player2.posX;
            const movement: number[] = [1, 1, -2, -2];
            for (let i = 0; i < 4; i++) {
                if (i % 2 === 0) {
                    player1.move(movement[i]!, this.arenaSize - 1);
                } else {
                    player2.move(movement[i]!, this.arenaSize - 1);
                }
                this.fieldImages[i + 1] = await getFieldImage(
                    player1,
                    player2,
                    this.arenaSize,
                );
            }
            player1.setPosition(p1Pos, this.arenaSize - 1);
            player2.setPosition(p2Pos, this.arenaSize - 1);
            this.fieldImageDirty = false;
        }
        if (this.builderOnfoDirty) {
            this.builderInfo = getFightDisplayOptions(this);
            // this.builderInfo = player1.getPlayerDisplay(
            //     player2,
            //     this.fieldImages[this.fieldImageIndex]!.attachment,
            // );
            // this.builderOnfoDirty = false;
        }
        if (this.actionRowButtonsDirty) {
            this.actionRowButtons = getButtons(this.getNextPlayer(), this);
            // this.actionRowButtons = player1.getActionRowButtons(
            //     this.id,
            //     this.playerTurn,
            // );
            // this.actionRowButtonsDirty = false;
        }
    }

    resetGame() {
        this.isActive = false;
        this.players = [];
        this.playerTurn = 1;
        this.discordUsers = [];
    }
}
