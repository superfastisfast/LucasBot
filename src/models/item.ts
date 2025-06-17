import fs from "fs";
import path from "path";

export namespace Item {
    export const Types = ["weapon", "shield", "helmet", "chestplate", "leggings", "boots", "item"] as const;

    export interface Base {
        name: string;
        cost: number;
        type: string;
        flatModifiers: Record<string, number>;
        percentageModifiers: Record<string, number>;
    }

    export class Manager {
        private items: Base[] = [];
        private readonly filePath: string = path.resolve(__dirname, "../../data/items.json");
        private loaded: boolean = false;

        constructor() {
            this.loadItems();
        }

        private loadItems() {
            if (this.loaded) return;
            try {
                const rawData = fs.readFileSync(this.filePath, "utf-8");
                this.items = JSON.parse(rawData);
                this.loaded = true;
            } catch (err) {
                console.error("Failed to load items:", err);
                this.items = [];
            }
        }

        findByName(name: string): Base | undefined {
            return this.items.find((item) => item.name.toLowerCase() === name.toLowerCase());
        }

        create(newItem: Base): this {
            const index = this.items.findIndex((item) => item.name === newItem.name);
            if (index !== -1) {
                this.items[index] = newItem;
            } else {
                this.items.push(newItem);
            }
            return this;
        }

        delete(name: string): boolean {
            const index = this.items.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
            if (index === -1) return false;
            this.items.splice(index, 1);
            return true;
        }

        save(): void {
            try {
                fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2));
            } catch (err) {
                console.error("Failed to save items:", err);
            }
        }

        getAll(): Base[] {
            return this.items;
        }

        find(query: Partial<Base>): Base[] {
            return this.items.filter((item) => {
                return Object.entries(query).every(([key, value]) => {
                    if (typeof value === "object" && value !== null) {
                        const subObj = (item as any)[key];
                        if (typeof subObj !== "object" || subObj === null) return false;

                        return Object.entries(value).every(([subKey, subValue]) => {
                            return subObj[subKey] === subValue;
                        });
                    }
                    return (item as any)[key] === value;
                });
            });
        }

        getRandom(): Base | undefined {
            if (this.items.length === 0) return undefined;
            const randomIndex = Math.floor(Math.random() * this.items.length);
            return this.items[randomIndex];
        }
    }

    export const manager = new Item.Manager();
}

export const ItemDB = undefined;
