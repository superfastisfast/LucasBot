import { Quest } from "@/quest";
import { Service } from "@/service";
import {
    Client,
} from "discord.js";

export default class QuestService extends Service.Base {
    intervalId: NodeJS.Timeout = undefined!;
    questChance: number = 0;

    override async start(client: Client): Promise<void> {
        this.intervalId = setInterval(() => this.update(client), 1000 * 60);
    }

    override async stop(client: Client): Promise<void> {
        clearInterval(this.intervalId)
    }

    private update(client: Client): void {
        // const currentTime = new Date().getTime();

        // Array.from(Quest.active).forEach((quest) => {
        //     if (currentTime > quest[1].endTime)
        //         Quest.end(quest[0]);
        // })

        // 120 is max amount of min 
        if (this.questChance < 120) {
            this.questChance += Math.floor(Math.random() * 3);
            return;
        }
        this.questChance = 0;

        const quests = Array.from(Quest.quests)
        const randomQuestIndex = Math.floor(Math.random() * quests.length);
        [...quests.slice(randomQuestIndex), ...quests.slice(0, randomQuestIndex)]
            .forEach((quest) => {
                if (quest && quest[1].isActive === false) {
                    Quest.start(client, quest[0])
                    return;
                }
            })
    };
}
