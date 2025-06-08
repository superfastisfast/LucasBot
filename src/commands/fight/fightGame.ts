import { DataBase } from "@/models/user";
import Fighter from "./fighter";
import type { User as DiscordUser } from "discord.js";
import { BLOCK_SIZE } from "./fieldGenerate";
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
    bet: number = 0;

    private static nextId: number = 0;
    id: number = 0;

    constructor(
        discordUser1: DiscordUser,
        discordUser2: DiscordUser,
        amount: number,
    ) {
        this.id = FightGame.nextId++;
        this.bet = amount;
        this.discordUsers = [discordUser1, discordUser2];
    }

    async initGame(id: string): Promise<GameInitializationResult> {
        if (id !== this.discordUsers[1]!.id)
            return { success: false, reason: "You are not the second player!" };

        const dbCommandUser = await DataBase.getDBUserFromUser(
            this.discordUsers[0]!,
        );
        const dbOpponentUser = await DataBase.getDBUserFromUser(
            this.discordUsers[1]!,
        );
        if (!dbCommandUser || !dbOpponentUser) {
            return {
                success: false,
                reason: "One or both users could not be found in the database.",
            };
        }
        if (
            dbCommandUser.inventory.gold < this.bet ||
            dbOpponentUser.inventory.gold < this.bet
        ) {
            return {
                success: false,
                reason: "One or both users could not afford the bet",
            };
        }
        DataBase.giveGold(this.discordUsers[0]!, -this.bet);
        DataBase.giveGold(this.discordUsers[1]!, -this.bet);

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
        currentPlayer.drainMana(1);
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
        const healthToGain =
            Math.random() * (currentPlayer.fighterStats.vitality || 1);
        const manaToGain =
            (Math.random() * (currentPlayer.fighterStats.stamina || 1)) / 3 + 1;
        currentPlayer.gainHealth(healthToGain);
        currentPlayer.gainMana(manaToGain);
        return `rested and regained ${healthToGain.toFixed(2)} health and ${manaToGain.toFixed(2)} mana.`;
    }

    nextTurn() {
        this.playerTurn = this.playerTurn === 0 ? 1 : 0;
        this.getCurrentPlayer().calculateStats();
        this.getNextPlayer().calculateStats();
    }

    gameOver(wasCompleted: boolean = false) {
        const winnerReward = this.bet * 2;
        if (this.players[0]!.currentHealth <= 0) {
            DataBase.giveGold(this.discordUsers[1]!, winnerReward);
        } else if (this.players[1]!.currentHealth <= 0) {
            DataBase.giveGold(this.discordUsers[0]!, winnerReward);
        } else {
            DataBase.giveGold(this.discordUsers[1]!, this.bet);
            DataBase.giveGold(this.discordUsers[0]!, this.bet);
        }
        if (wasCompleted) {
            DataBase.giveXP(this.discordUsers[0]!, 10);
            DataBase.giveXP(this.discordUsers[1]!, 10);
        }
    }
}
