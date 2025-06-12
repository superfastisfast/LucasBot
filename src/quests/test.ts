import type { Client, ButtonInteraction, TextChannel } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";

export default class TestQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map<string, AppButton>([
        ["Test", new AppButton("Test Label", this.onPressTest)],
    ]);

    amount: number = 0;

    override async start(client: Client): Promise<void> {
        this.amount = 0;

        const actionRow = AppButton.createActionRow(this.buttons, ["Test"])

        const channel = await Quest.getChannel(client);

        await channel.send({
            content: "Test!!!",
            components: actionRow,
        });
    }

    private async onPressTest(interaction: ButtonInteraction): Promise<void> {
        this.amount += 0;
        await interaction.reply({
            content: `I HATE Typescript AND I AM STEBE - Lucas: ${this.amount}`,
            flags: 'Ephemeral',
        });
    }
}