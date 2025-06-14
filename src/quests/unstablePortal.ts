import { type Client, Message, type ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";

export default class UnstablePortalQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map<string, AppButton>([
        ["Enter", new AppButton("Enter", this.onPressEnter.bind(this))],
        ["Destroy", new AppButton("Destroy", this.onPressDestroy.bind(this))],
    ]);

    goldReward: number = 10;
    isDestroyed: boolean = false;

    public override async start(client: Client): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons, ["Enter", "Destroy"])
        const embed = new EmbedBuilder()
            .setTitle("Unstable Portal")
            .setDescription("A shimmering portal has appeared! Strange energy pulses from within. Try to enter the portal based on ✨magic. Or destroy the portal and receive a reward 100% success rate")
            .setColor("#0099ff")
            .setImage("https://cdn.discordapp.com/attachments/1379101132743250082/1382031141577425076/WEQ4VWpwSE5RPQ.png?ex=6849ac4d&is=68485acd&hm=4cc8f7af4c76a4fd083f4eafb50935fc5e07dec05be3c742b0c25336f33aee8f&")
            .setURL("https://www.youtube.com/@LucasDevelop")
            .toJSON();

        return await Quest.channel.send({
            embeds: [embed],
            components: actionRow,
        });
    }

    private async onPressEnter(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        const successfullyEnterdPortal: boolean = (Math.floor(Math.random() * 100 - user.database.stats.magicka) > 50);
        const successfullyEarnLoot: boolean = (Math.floor(Math.random() * 10 + user.database.stats.magicka) > 9);

        const goldAmount = Math.floor(Math.random() * 100);

        if (successfullyEnterdPortal && successfullyEarnLoot) 
            await user
                .addSkillPoints(0.25)
                .addGold(goldAmount)
                .save();

        await interaction.reply({
            content: this.isDestroyed ? "You can't enter the portal anymore... someone destroyed it!" : `You ${successfullyEnterdPortal ? "successfully" : "unsuccessfully"} entered the portal${!successfullyEarnLoot ? "!" : ` and you got ${goldAmount} gold and 0.25 skillpoints`}`,
            flags: 'Ephemeral',
        });
    }

    private async onPressDestroy(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({
            content: this.isDestroyed ? "You can't destroy the portal anymore... someone destroyed it!" : "You destroyed the portal!",
            flags: 'Ephemeral',
        });
        this.isDestroyed = true;
    }
}
