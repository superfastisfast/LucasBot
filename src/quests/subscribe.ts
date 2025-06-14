import { type Client, Message, type ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";

export default class SubscribeQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map<string, AppButton>([
        ["Yes", new AppButton("Yes", this.onPressYes.bind(this))],
        ["No", new AppButton("No", this.onPressNo.bind(this))],
    ]);

    xpRewardAmount: number = 10

    public override async start(client: Client): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons, ["Yes", "No"])
        const embed = new EmbedBuilder()
            .setTitle("Subscribed")
            .setDescription("Are you subscribed to Lucas?")
            .setColor("#e63946")
            .setImage("https://cdn.discordapp.com/attachments/1379101132743250082/1379101169892327434/subscribe-7403560_1280.png?ex=683f038d&is=683db20d&hm=6e7deb8d64bc3a019f13547c0c16191322469c463211f937dd0486783c1c9529&")
            .setURL("https://www.youtube.com/@LucasDevelop")
            .toJSON();

        return await Quest.channel.send({
            embeds: [embed],
            components: actionRow,
        });
    }

    private async onPressYes(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        await user.addXP(this.xpRewardAmount).save();

        await interaction.reply({
            content: `**Good 😊** You gained ${this.xpRewardAmount} XP! Now tell a friend?`,
            flags: 'Ephemeral',
        });
    }

    private async onPressNo(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({
            content: `WTF why are you here if you'r not even subscribed?!?!?`,
            flags: 'Ephemeral',
        });
    }
}
