import type { Client, TextChannel } from "discord.js";
import type { AppButton } from "./button";



// NOTE: Remove New in names
export namespace NewQuest {
    export abstract class Base {
        globalID: number = 0;

        public abstract buttons: Map<string, AppButton>;

        public get info(): any {
            return undefined;
        }
        public async start(client: Client): Promise<void> {}
    }

    export const quests: Map<string, Base> = new Map();

    export async function load() {
        const glob = new Bun.Glob("src/new_quests/*.ts");
        console.log(`Registered quests:`);

        for (const path of glob.scanSync(".")) {
            const file = Bun.file(path);

            const { default: QuestClass } = await import(
                path.replace("src/new_quests/", "./new_quests/")
            );
            const quest: Base = new QuestClass();

            const name = path.split("/").pop()?.replace(".ts", "")!;

            console.log(`\t${name}`);
            quests.set(name, quest);
        }
    }

    export async function start(client: Client, name: string) {
        await quests.get(name)?.start(client);
    }

    export async function getChannel(client: Client): Promise<TextChannel> {
        if (!process.env.QUEST_CHANNEL_ID)
            throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        return (await client.channels.fetch(
            process.env.QUEST_CHANNEL_ID,
        )) as TextChannel;
    }
}

