import type { ButtonInteraction, Client } from "discord.js";
import { QuestModel, type QuestDocument } from "./models/quest";

export namespace Quest {
    export abstract class Base {
        public async onButtonInteract(
            client: Client,
            interaction: ButtonInteraction,
        ): Promise<boolean> {
            return false;
        }
        public abstract startQuest(client: Client): Promise<void>;
        public abstract endQuest(client: Client): Promise<void>;
        public fileName = "";
        //TODO: when quest end?
        public endDate?: Date;
        public hasEnded(): boolean {
            return !(
                this.endDate && this.endDate.getTime() > new Date().getTime()
            );
        }
        public generateEndDate(offSetTimeMilliseconds: number) {
            const currentTimestamp = new Date().getTime();
            const newTimestamp = currentTimestamp + offSetTimeMilliseconds;
            this.endDate = new Date(newTimestamp);
        }

        public async getQuestData(): Promise<QuestDocument> {
            return (await QuestModel.findOne({ className: this.fileName }))!;
        }
    }

    export const quests: Map<string, Quest.Base> = new Map();

    export async function loadQuests() {
        const glob = new Bun.Glob("src/quests/*.ts");
        console.log(`Registered quests:`);

        for (const path of glob.scanSync(".")) {
            const file = Bun.file(path);

            const { default: QuestClass } = await import(
                path.replace("src/quests/", "./quests/")
            );
            const quest: Quest.Base = new QuestClass();

            quest.fileName = path.split("/").pop()?.replace(".ts", "")!;

            Quest.quests.set(quest.fileName, quest);
            console.log(`\t${quest.fileName}`);
        }
    }

    export async function handleButtonInteraction(
        client: Client,
        interaction: any,
    ) {
        for (const quest of await Quest.getQuests()) {
            try {
                if (await quest.onButtonInteract(client, interaction)) {
                    break;
                }
            } catch (err) {
                console.error(
                    `Error running button interaction for quest ${quest.fileName}:`,
                    err,
                );
            }
        }
    }

    export function getQuest(name: string): Quest.Base | undefined {
        return Quest.quests.get(name);
    }

    export function getQuests(): Quest.Base[] {
        return Array.from(Quest.quests.values());
    }
}
