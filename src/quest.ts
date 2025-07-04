import { type Message } from "discord.js";
import type { AppButton } from "./ui";

export namespace Quest {
    export abstract class Base {
        public abstract buttons: AppButton[];

        public message: Message<true> = undefined!;
        public name: string = undefined!;

        public maxTimeActiveMS: number = 1000 * 60 * 30;
        public endTime: number = 0;
        public readonly isActive: boolean = false;

        public async start(): Promise<Message<true>> {
            return undefined!;
        }
        public async end() {
            console.log("Called inbuilt end for " + this.name);
        }

        get class(): new (...args: any[]) => this {
            return this.constructor as new (...args: any[]) => this;
        }
    }

    export const quests: Map<string, Base> = new Map();
    export const active: Map<string, Base> = new Map();

    export async function load() {
        const glob = new Bun.Glob("src/quests/*.ts");
        console.log(`Loaded quests:`);

        for (const path of glob.scanSync(".")) {
            const { default: QuestClass } = await import(path.replace("src/quests/", "./quests/"));
            const quest: Base = new QuestClass();

            const name = path
                .split("/")
                .pop()
                ?.replace(".ts", "")
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .toLowerCase()!;
            quest.name = name;

            console.log(`\t${name}`);
            quests.set(name, quest);
        }
    }

    export async function start(name: string) {
        try {
            const oldQuest = await quests.get(name);
            if (!oldQuest) return console.log(`Failed to get quest: '${name}'`);

            const currentTime = new Date().getTime();

            const quest = new oldQuest.class();
            quest.name = oldQuest.name;
            quest.endTime = currentTime + quest.maxTimeActiveMS;
            (quest as any).isActive = true;
            quest.message = await quest.start();

            const min = Math.round(Math.abs(quest.endTime / 1000 - currentTime / 1000)) / 60;

            quest.message.edit({
                content: `${Math.floor(min / 60)}h ${(min % 60).toFixed()}min <@&${process.env.QUEST_ROLE || "none"}>`,
            });

            quests.set(name, quest);
            active.set(name, quest);
            console.log(`${new Date().toISOString()} Started quest: ${name}`);
        } catch (error) {
            console.error(`Failed to start quest: ${name}`, error);
        }
    }

    export interface EndReturn {}

    export async function end(name: string): Promise<EndReturn> {
        try {
            const quest = await quests.get(name);
            if (!quest) {
                console.log(`Failed to get quest: '${name}'`);
                return {};
            }

            if (quest.isActive) quest.end();
            (quest as any).isActive = false;
            quest.message.edit({
                content: "Quest ended",
                components: [],
            });
            active.delete(name);
            console.log(`${new Date().toISOString()} Ended quest: ${name}`);
        } catch (error) {
            console.error(`Failed to end quest: ${name}`, error);
        }

        return {};
    }
}
