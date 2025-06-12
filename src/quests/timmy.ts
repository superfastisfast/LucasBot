import type { Client, ButtonInteraction, TextChannel } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";

export default class TimmyQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map<string, AppButton>([
        ["Help", new AppButton("Help", this.onPressHelp)],
        ["Do Nothing", new AppButton("Do nothing", this.onPressDoNothing)],
        ["Kill", new AppButton("Kill", this.onPressKill)],
    ]);


    override async start(client: Client): Promise<void> {
        const actionRow = AppButton.createActionRow(this.buttons, ["Help", "Do Nothing", "Kill"])

        const channel = await Quest.getChannel(client);

        await channel.send({
            content: "You walk in the woods and find a boy called Timmy, he askes you for help. What do you do?",
            components: actionRow,
        });
    }

    private async onPressHelp(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.createFromID(interaction.user.id);

        user.database.stats.strength -= 3;
        user.save()
        interaction.reply({
            content: `You helped but you also lost 3 strengh`, 
            flags: 'Ephemeral',
        });
    }

    private onPressDoNothing(interaction: ButtonInteraction): void {
        interaction.reply({
            content: `You decided to do nothing, you gain nothing...`,
            flags: 'Ephemeral',
        });
    }

    private async onPressKill(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.createFromID(interaction.user.id);

        user.addGold(100).save();

        interaction.reply({
            content: `Bastard, but you gain 100 gold`,
            flags: 'Ephemeral',
        });
    }
}