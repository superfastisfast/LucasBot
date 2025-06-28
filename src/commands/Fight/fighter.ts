import { Globals } from "@/index";
import type { AppUser } from "@/user";
import type { PlayerAction } from "./fieldGenerate";

export default class Fighter {
    appUser!: AppUser;
    posX: number = 0;
    currentHealth: number = 0;
    currentMana: number = 0;
    attackRange: number = 1;

    constructor(appUser: AppUser) {
        this.appUser = appUser;
        this.currentHealth = this.getMaxHealthStats();
        this.currentMana = this.getMaxManaStats();
    }

    getMaxHealthStats(): number {
        let maxHealth = this.appUser.getStat("vitality") || 1;
        return maxHealth > 100 ? 100 : maxHealth;
    }
    getMaxManaStats(): number {
        let maxHealth = this.appUser.getStat("stamina") || 1;
        return maxHealth > 100 ? 100 : maxHealth;
    }

    attack(opponent: Fighter): PlayerAction {
        this.drainMana(1);
        if (Math.abs(this.posX - opponent.posX) <= this.attackRange) {
            const damage = Globals.randomFloat(0, this.appUser.getStat("strength"));
            return opponent.receiveDamage(damage);
        } else {
            return { type: "attack", damageTaken: 0 };
        }
    }
    receiveDamage(damage: number): PlayerAction {
        const defense = this.appUser.getStat("defense");
        if (defense > 0) {
            if (Math.random() > damage / defense) {
                return { type: "attack", damageTaken: 0 };
            }
        }
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        return { type: "attack", damageTaken: -damage };
    }

    flee(): boolean {
        this.drainMana(1);
        return this.appUser.getStat("agility") / 100 > Math.random();
    }
    sleep(): PlayerAction {
        const randomHealthGain = Globals.randomFloat(this.appUser.getStat("vitality") / 20, this.appUser.getStat("vitality") / 8);
        const randomManaGain = Globals.randomFloat(1, this.appUser.getStat("stamina") / 8);
        this.gainHealth(randomHealthGain);
        this.gainMana(randomManaGain);
        return { type: "sleep", healthRegained: randomHealthGain, manaRegained: randomManaGain };
    }

    gainHealth(amount: number) {
        this.currentHealth = Math.min(this.getMaxHealthStats(), this.currentHealth + amount);
    }

    gainMana(amount: number) {
        this.currentMana = Math.min(this.getMaxManaStats(), this.currentMana + amount);
    }

    drainMana(amount: number): boolean {
        if (this.currentMana >= amount) {
            this.currentMana -= amount;
            return true;
        }
        return false;
    }

    move(direction: "left" | "right", arenaSize: number): PlayerAction {
        this.drainMana(1);
        if (direction === "left") {
            this.posX = Math.max(0, this.posX - 1);
        } else if (direction === "right") {
            this.posX = Math.min(arenaSize - 1, this.posX + 1);
        }
        return { type: "move" };
    }
}
