import { CommandInteraction, InteractionResponse, ModalSubmitInteraction } from "discord.js";
import { AppModal, type AppModalField } from "../../ui";
import { Globals } from "../..";
import { AppUser } from "@/user";
import { Profession } from "../work";

export default class LucasQuiz extends Profession {
    static questions: [string, string, string][] = [
        ["Lucas's favorit language?", "A: Zig\nB: C++\nC: C\nD: Typescript", "C"],
        ["Lucas's least favorit language?", "A: Python\nB: C++\nC: C\nD: Typescript", "A"],
        ["Does Lucas like pineapple 🍍?", "A: Yes\nB: No", "A"],
        ["Does Lucas hit Jim?", "A: No\nB: Yes", "B"],
        ["How much can Lucas bench 🏋️‍♂️?", "A: 70kg\nB: 80kg\nC: 90kg\nD: 100kg\nE: 110kg", "D"],
    ];

    public override async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        let questions: [string, string, string][] = [];
        let fields: AppModalField[] = [];

        const randomQuestions = LucasQuiz.questions.sort(() => Math.random() - 0.5).slice(0, 5);

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

        const modal = new AppModal("Enter in A, B, C or D to help Lucas", fields, async (modal: AppModal, interaction: ModalSubmitInteraction) => {
            let solvedCount: number = 0;

            for (let i: number = 0; i < randomQuestions.length; i++) {
                const answer = modal.getField(interaction, randomQuestions[i]?.[0] || "");
                const question: string = (randomQuestions[i] ?? ["", "", ""])[2];

                if (answer === question) solvedCount++;
            }

            const user = await AppUser.fromID(interaction.user.id);
            const reward = solvedCount / 10;
            await user.addGold(reward).save();

            await interaction.reply({
                content: `You helped Lucas make his latest video!\n+${reward.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`,
                flags: "Ephemeral",
            });
        });

        return (await interaction.showModal(modal.builder)) as any;
    }
}
