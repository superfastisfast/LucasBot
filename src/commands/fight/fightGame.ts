import { getUserFromId } from "@/models/user";
import Fighter from "./fighter";
import type { User as DiscordUser } from "discord.js";

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

    constructor(discordUser1: DiscordUser, discordUser2: DiscordUser) {
        this.discordUsers = [discordUser1, discordUser2];
    }

    async initGame(id: string): Promise<GameInitializationResult> {
        if (id !== this.discordUsers[1]!.id)
            return { success: false, reason: "You are not the second player!" };

        const dbCommandUser = await getUserFromId(this.discordUsers[0]!.id);
        const dbOpponentUser = await getUserFromId(this.discordUsers[1]!.id);
        if (!dbCommandUser || !dbOpponentUser) {
            return {
                success: false,
                reason: "One or both users could not be found in the database.",
            };
        }
        this.players[0] = new Fighter(
            dbCommandUser,
            0,
            this.discordUsers[0]!.displayAvatarURL(),
        );
        this.players[1] = new Fighter(
            dbOpponentUser,
            this.arenaSize - 1,
            this.discordUsers[1]!.displayAvatarURL(),
        );
        this.isActive = true;
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
        const currentPlayer = this.getCurrentPlayer();
        if (direction === "left") {
            currentPlayer.posX = Math.max(0, currentPlayer.posX - 1);
        } else if (direction === "right") {
            currentPlayer.posX = Math.min(
                this.arenaSize - 1,
                currentPlayer.posX + 1,
            );
        }
    }
    playerAttack(): string {
        const currentPlayer = this.getCurrentPlayer();
        const opponent = this.getNextPlayer();
        const actionInfo: string = currentPlayer.attack(opponent);
        if (opponent.currentHealth <= 0) {
            this.resetGame();
            return `${opponent.dbUser!.username} has been defeated!`;
        }
        return actionInfo;
    }
    playerFlee(): boolean {
        const currentPlayer = this.getCurrentPlayer();
        return currentPlayer.dbUser!.agility / 100 > Math.random();
    }

    nextTurn() {
        this.playerTurn = this.playerTurn === 0 ? 1 : 0;
    }

    resetGame() {
        this.isActive = false;
        this.players = [];
        this.playerTurn = 1;
        this.discordUsers = [];
    }
}
