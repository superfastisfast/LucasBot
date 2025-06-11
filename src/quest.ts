import type { ButtonInteraction, Client, EmbedFooterOptions } from "discord.js";
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
        public fileName = "";
        public endDate: Date = new Date();
        public isQuestActive(): boolean {
            return (
                this.endDate !== undefined &&
                this.endDate.getTime() > new Date().getTime()
            );
        }
        public generateEndDate(offSetTimeMilliseconds: number) {
            const currentTimestamp = new Date().getTime();
            const newTimestamp = currentTimestamp + offSetTimeMilliseconds;
            this.endDate = new Date(newTimestamp);
        }

        public generateFooter(): EmbedFooterOptions {
            return {
                text:
                    "Quest Started: " +
                    new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZoneName: "shortOffset",
                    }) +
                    "\nQuest Ends: " +
                    this.endDate?.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZoneName: "shortOffset",
                    }),
            };
        }

        public async getQuestData(): Promise<QuestDocument> {
            return (await QuestModel.findOne({ className: this.fileName }))!;
        }
        public generateUniqueButtonID(): string {
            return `${this.fileName}_${this.endDate}`;
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
    export function generateRadomQuest(client: Client) {
        const quests: Quest.Base[] = Quest.getQuests();
        const firstIndex = Math.floor(Math.random() * quests.length);
        for (let index = 0; index < quests.length; index++) {
            let quest = quests[(firstIndex + index) % quests.length];
            console.log("index: " + index);
            if (quest && quest.isQuestActive() === false) {
                quest.startQuest(client);
                return;
            }
        }
    }

    export async function handleButtonInteraction(
        client: Client,
        interaction: any,
    ) {
        for (const quest of await Quest.getQuests()) {
            try {
                if (quest.isQuestActive() === false) continue;
                if (await quest.onButtonInteract(client, interaction)) {
                    return true;
                }
            } catch (err) {
                console.error(
                    `Error running button interaction for quest ${quest.fileName}:`,
                    err,
                );
                return false;
            }
        }
        return false;
    }

    export function getQuest(name: string): Quest.Base | undefined {
        return Quest.quests.get(name);
    }

    export function getQuests(): Quest.Base[] {
        return Array.from(Quest.quests.values());
    }
}
