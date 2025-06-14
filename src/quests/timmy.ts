import type { Client, Message, ButtonInteraction } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";

export default class TimmyQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map<string, AppButton>([
        ["Help", new AppButton("Help", this.onPressHelp)],
        ["Kill", new AppButton("Kill", this.onPressKill)],
    ]);

    public override async start(client: Client): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons, ["Help", "Kill"])

        return await Quest.channel.send({
            content: "You walk in the woods and find a boy called Timmy, he askes you for help. What do you do?",
            components: actionRow,
        });
    }

    private async onPressHelp(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        user.database.stats.strength -= 3;
        await user.save()
        interaction.reply({
            content: `You helped but you also lost 3 strengh`, 
            flags: 'Ephemeral',
        });
    }

    private async onPressKill(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        await user.addGold(100).save();

        await interaction.reply({
            content: `Bastard, but you gain 100 gold`,
            flags: 'Ephemeral',
        });
    }
}