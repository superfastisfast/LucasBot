import { CommandInteraction, InteractionResponse, ModalSubmitInteraction } from "discord.js";
import { AppModal, type AppModalField } from "../../ui";
import { Globals } from "../..";
import { AppUser } from "@/user";
import { Profession } from "../work";

export default class StudentProfession extends Profession {
    static questions: [string, string][] = [
        ["1+1", "2"],
        ["3*4", "12"],
        ["5-2", "3"],
        ["10/2", "5"],
        ["2^3", "8"],
        ["7+6", "13"],
        ["9-5", "4"],
        ["6*7", "42"],
        ["100/25", "4"],
        ["8+2*3", "14"],
        ["(8+2)*3", "30"],
        ["15%4", "3"],
        ["3*2", "6"],
        ["9+10", "19"],
        ["14-7", "7"],
        ["0*100", "0"],
        ["4+5", "9"],
        ["12-8", "4"],
        ["6/3", "2"],
        ["3^2", "9"],
        ["2+2*2", "6"],
        ["(2+2)*2", "8"],
        ["18/3", "6"],
        ["20-4*2", "12"],
        ["(20-4)*2", "32"],
        ["5+5+5", "15"],
        ["2^4", "16"],
        ["10%3", "1"],
        ["7*5", "35"],
        ["64/8", "8"],
        ["1+1+1+1", "4"],
        ["11+11", "22"],
        ["50/5", "10"],
        ["9*3", "27"],
        ["30-6", "24"],
        ["7+8", "15"],
    ];

    public override async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        let questions: [string, string][] = [];
        let fields: AppModalField[] = [];

        const randomQuestions = StudentProfession.questions.sort(() => Math.random() - 0.5).slice(0, 5);

        randomQuestions.forEach((question, i) => {
            questions.push(question);

            fields.push({
                name: `${question[0]}`,
                style: "Short",
                placeholder: "Don't you dare use a calculator",
                required: false,
            });
        });

        const modal = new AppModal("C Internship, fix all the issues", fields, async (modal: AppModal, interaction: ModalSubmitInteraction) => {
            let solvedCount: number = 0;
            const maxSolvedCount = [...modal.fields.values()].length;

            for (let i: number = 0; i < randomQuestions.length; i++) {
                const answer = modal.getField(interaction, randomQuestions[i]?.[0] || "");
                const question: string = (randomQuestions[i] ?? ["", ""])[1];

                if (answer === question) solvedCount++;
            }

            const user = await AppUser.fromID(interaction.user.id);
            const reward = solvedCount / Math.min(1, maxSolvedCount - user.getStat("magicka"));
            await user.addGold(reward).save();

            await interaction.reply({
                content: `You solved ${solvedCount}/${maxSolvedCount} math problems\n+${reward.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`,
                flags: "Ephemeral",
            });
        });

        return (await interaction.showModal(modal.builder)) as any;
    }
}
