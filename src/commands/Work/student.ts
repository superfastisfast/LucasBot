import { ModalSubmitInteraction } from "discord.js";
import { AppModal } from "../../ui";
import { Globals } from "../..";
import { AppUser } from "@/user";
import { Profession } from "../work";

export default class StudentProfession extends Profession {
    constructor() {
        const num1 = Globals.random(0, 1000);
        const num2 = Globals.random(0, 1000);

        const modal = new AppModal(
            "Homework",
            [
                {
                    name: `What is ${num1} + ${num2}`,
                    placeholder: "Don't you dare use a calculator...",
                },
                {
                    name: `What is ${num1} * ${num2}`,
                    placeholder: "Don't you dare use a calculator...",
                },
            ],
            async (interaction: ModalSubmitInteraction) => {
                const hello = interaction.fields.getField(`What is ${num1} + ${num2}`).value as string;

                await interaction.reply({
                    content: "Hello, world? " + hello,
                    flags: "Ephemeral",
                });
            },
        );

        super(modal);
    }
}
