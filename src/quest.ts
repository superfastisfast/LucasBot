import type { Client, TextChannel } from "discord.js";
import type { AppButton } from "./button";

export namespace Quest {
    export abstract class Base {
        public globalID: number = 0;
        public endDate: Date = new Date();
        public timerMS: number = 1000 * 60 * 10;

        public abstract buttons: Map<string, AppButton>;

        public get info(): any {
            return undefined;
        }
        public async start(client: Client): Promise<void> {}

        public generateEndDate() {
            const currentTimestamp = new Date().getTime();
            const newTimestamp = currentTimestamp + this.timerMS;
            this.endDate = new Date(newTimestamp);
        }
        public isQuestActive(): boolean {
            return (
                this.endDate !== undefined &&
                this.endDate.getTime() > new Date().getTime()
            );
        }
    }

    export const quests: Map<string, Base> = new Map();

    export async function load() {
        const glob = new Bun.Glob("src/quests/*.ts");
        console.log(`Registered quests:`);

        for (const path of glob.scanSync(".")) {
            const file = Bun.file(path);

            const { default: QuestClass } = await import(
                path.replace("src/quests/", "./quests/")
            );
            const quest: Base = new QuestClass();

            const name = path.split("/").pop()?.replace(".ts", "")!;

            console.log(`\t${name}`);
            quests.set(name, quest);
        }
    }

    export async function start(client: Client, name: string) {
        try {
            const quest = await quests.get(name);
            if (!quest) throw undefined;

            quest.generateEndDate();
            quest.start(client);

        } catch (error) {
            console.error(`Failed to start quest: ${name}`, error)
        }
    }

    export async function getChannel(client: Client): Promise<TextChannel> {
        if (!process.env.QUEST_CHANNEL_ID)
            throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        return (await client.channels.fetch(
            process.env.QUEST_CHANNEL_ID,
        )) as TextChannel;
    }

    export function generateRadomQuest(client: Client) {
        const arr = Array.from(quests);
        const firstIndex = Math.floor(Math.random() * arr.length);
        for (let index = 0; index < arr.length; index++) {
            let quest = arr[(firstIndex + index) % arr.length];
            console.log("index: " + index);
            if (quest && quest[1].isQuestActive() === false) {
                start(client, quest[0])
                return;
            }
        }
    }
}
