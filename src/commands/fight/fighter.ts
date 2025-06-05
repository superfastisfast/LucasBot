import type { UserDocument } from "@/models/user";

export default class Fighter {
    dbUser?: UserDocument;
    posX: number = 0;
    currentHealth: number = 0;
    currentMana: number = 0;
    imgeUrl: string = "";

    constructor(dbUser: UserDocument, startPosition: number, imgUrl: string) {
        this.dbUser = dbUser;
        this.posX = startPosition;
        this.currentHealth = this.getMaxHealthStats();
        this.currentMana = this.getMaxManaStats();
        this.imgeUrl = imgUrl;
    }

    getMaxHealthStats(): number {
        return (this.dbUser?.vitality || 1) * 10;
    }
    getMaxManaStats(): number {
        return this.dbUser?.stamina || 1;
    }
    attack(opponent: Fighter) {
        if (Math.abs(this.posX - opponent.posX) < 2) {
            const damage = Math.random() * this.dbUser!.strength + 1;
            return opponent.receiveDamage(damage);
        } else {
            return "Too far away to attack!";
        }
    }
    receiveDamage(damage: number) {
        if (this.dbUser!.defense > 0) {
            if (Math.random() > damage / this.dbUser!.defense) {
                return this.dbUser!.username + ": Blocked the attack!";
            }
        }
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        return (
            this.dbUser!.username +
            ": Received " +
            damage.toFixed(2) +
            " damage!"
        );
    }

    gainHealth(amount: number) {
        this.currentHealth = Math.min(
            this.getMaxHealthStats(),
            this.currentHealth + amount,
        );
    }

    gainMana(amount: number) {
        this.currentMana = Math.min(
            this.getMaxManaStats(),
            this.currentMana + amount,
        );
    }

    drainMana(amount: number): boolean {
        if (this.currentMana >= amount) {
            this.currentMana -= amount;
            return true;
        }
        return false;
    }
}
