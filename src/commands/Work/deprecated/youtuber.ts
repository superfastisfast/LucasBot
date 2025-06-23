import { ModalSubmitInteraction } from "discord.js";
import { AppModal, type AppModalField } from "../../ui";
import { Globals } from "../..";
import { AppUser } from "@/user";
import { Profession } from "../work";

export default class YoutuberProfession extends Profession {
    static questions: [string, string, string][] = [
        ["Which title gets more views?", "A: I spent 24h in a haunted house\nB: Exploring an old hotel\nC: My weirdest night ever", "A"],
        ["Pick the best thumbnail idea", "A: Big red arrow on secret door\nB: Me smiling with trees\nC: Screenshot from my vlog", "A"],
        ["What's a stronger video idea?", "A: I gave $100 to a stranger\nB: Shopping at Walmart", "A"],
        ["Which title makes you curious?", "A: I followed someone for 1 day\nB: Paris trip vlog\nC: What I saw in the alley", "A"],
        ["Which idea has the most suspense?", "A: I found a hidden tunnel\nB: My walk in the forest\nC: Exploring a store", "A"],
        ["Best clickbait title?", "A: I spent $10,000 in 10 min\nB: Going to the mall\nC: I bought candy\nD: My shopping trip", "A"],
        ["Pick the best title for a challenge", "A: 48h on $1 only\nB: Cheap meals test\nC: 3 days no phone\nD: My diet story", "A"],
        ["What title gets more clicks?", "A: I stayed awake 72h\nB: Trying coffee\nC: I fixed my car\nD: Long walk at night", "A"],
        ["Which idea sounds more fun?", "A: I bought 50 sodas\nB: Taste test snacks\nC: Made my own chips\nD: Ranking top 5 drinks", "A"],
        ["Which title stands out more?", "A: I spent 1 week in my car\nB: Road trip vlog\nC: A long drive\nD: Sleeping in my van", "A"],
    ];

    constructor() {
        let questions: [string, string, string][] = [];
        let fields: AppModalField[] = [];

        const randomQuestions = YoutuberProfession.questions.sort(() => Math.random() - 0.5).slice(0, 5);

        randomQuestions.forEach((question, i) => {
            questions.push(question);

            fields.push({
                name: `${question[0]}`,
                style: "Paragraph",
                placeholder: question[1],
                required: false,
                maxLength: 1,
            });
        });

        const modal = new AppModal(
            "Enter in A, B, C or D to help Mr. Beast",
            fields,
            async (modal: AppModal, interaction: ModalSubmitInteraction) => {
                let solvedCount: number = 0;

                for (let i: number = 0; i < randomQuestions.length; i++) {
                    const answer = modal.getField(interaction, randomQuestions[i]?.[0] || "");
                    const question: string = (randomQuestions[i] ?? ["", "", ""])[2];

                    if (answer === question) solvedCount++;
                }

                const user = await AppUser.fromID(interaction.user.id);
                const reward = solvedCount * Math.max(0, user.getStat("charisma") - 5) + user.getStat("magicka") / 2;
                await user.addGold(reward).save();

                await interaction.reply({
                    content: `You helped Mr. Beast make his latest video!\n+${reward.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`,
                    flags: "Ephemeral",
                });
            },
        );

        super(modal);
    }
}
