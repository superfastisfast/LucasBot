import { Quest } from "@/quest";
import { Service } from "@/service";
import { Client } from "discord.js";

export default class QuestService extends Service.Base {
    intervalId: NodeJS.Timeout = undefined!;
    questChance: number = 0;

    override async start(client: Client): Promise<void> {
        this.intervalId = setInterval(() => this.update(), 1000 * 60);
    }

    override async stop(client: Client): Promise<void> {
        clearInterval(this.intervalId);
    }

    private update(): void {
        const currentTime = new Date().getTime();

        Quest.active.forEach((quest) => {
            const min = Math.round(Math.abs(quest.endTime / 1000 - currentTime / 1000)) / 60;

            quest.message.edit({
                content: `${Math.floor(min / 60)}h ${(min % 60).toFixed()}min`,
            });
        });

        Array.from(Quest.active).forEach((quest) => {
            if (currentTime > quest[1].endTime) Quest.end(quest[0]);
        });

        // 120 is max amount of min
        if (this.questChance < 120) {
            this.questChance += 1 + Math.random();
            return;
        }
        this.questChance = 0;

        const quests = Array.from(Quest.quests);
        const firstIndex = Math.floor(Math.random() * quests.length);
        for (let index = 0; index < quests.length; index++) {
            let quest = quests[(firstIndex + index) % quests.length];
            if (quest && quest[1].isActive === false) {
                Quest.start(quest[0]);
                return;
            }
        }
    }
}
