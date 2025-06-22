import { ModalSubmitInteraction } from "discord.js";
import { AppModal, type AppModalField } from "../../ui";
import { Globals } from "../..";
import { AppUser } from "@/user";
import { Profession } from "../work";

export default class StudentProfession extends Profession {
    // prettier-ignore
    static questions: [string, string][] = [
        ["1+1", "2"],
        ["1+1", "2"]
    ];

    constructor() {
        let questions: [string, string][] = [];
        let fields: AppModalField[] = [];

        const randomQuestions = StudentProfession.questions.sort(() => Math.random() - 0.5);

        randomQuestions.forEach((question, i) => {
            questions.push(question);

            fields.push({
                name: `#${i + 1}`,
                value: question[0].slice(0, 4000),
                style: "Paragraph",
            });
        });

        const modal = new AppModal("C Internship, fix all the issues", fields, async (interaction: ModalSubmitInteraction) => {
            let solvedCount: number = 0;

            for (let i: number = 0; i < randomQuestions.length; i++) {
                const answer = interaction.fields.getField(`#${i + 1}`).value as string;
                const question = randomQuestions[i] ?? "";
                if (String(answer).trim() === String(question[1]).trim()) solvedCount++;
            }

            const user = await AppUser.fromID(interaction.user.id);
            const reward = solvedCount * Math.max(0, user.getStat("charisma") - 5) + user.getStat("magicka") / 3;
            await user.addGold(reward).save();

            await interaction.reply({
                content: `You solved ${solvedCount}/${modal.fields.length} math problems\n+${reward.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`,
                flags: "Ephemeral",
            });
        });

        super(modal);
    }
}
