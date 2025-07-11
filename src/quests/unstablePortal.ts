import { Message, type ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/ui";
import { AppUser } from "@/user";
import { Globals } from "..";

export default class UnstablePortalQuest extends Quest.Base {
    public override buttons: AppButton[] = [
        new AppButton("Enter", this.onPressEnter.bind(this)),
        new AppButton("Destroy", this.onPressDestroy.bind(this)),
    ];

    isDestroyed: boolean = false;

    public override async start(): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons);
        const embed = new EmbedBuilder()
            .setTitle("Unstable Portal")
            .setDescription(
                "A shimmering portal has appeared! Strange energy pulses from within. Try to enter the portal based on ✨magic. Or destroy the portal and receive a reward 100% success rate",
            )
            .setColor("#0099ff")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1382031141577425076/WEQ4VWpwSE5RPQ.png?ex=6849ac4d&is=68485acd&hm=4cc8f7af4c76a4fd083f4eafb50935fc5e07dec05be3c742b0c25336f33aee8f&",
            )
            .setURL(Globals.LINK);

        return await Globals.CHANNEL.send({
            embeds: [embed],
            components: actionRow,
        });
    }

    private async onPressEnter(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        const successfullyEnterdPortal: boolean = Math.floor(Math.random() * 100 + user.database.stats.magicka * 0.1) > 99;
        const successfullyEarnLoot: boolean = Math.random() * 100 + user.database.stats.magicka * 0.1 > 0.5;
        const destroyedPortal: boolean = Math.random() > 0.6;
        const reward: number = Globals.random(0, 10);

        if (successfullyEnterdPortal) user.addSkillPoints(1);
        if (successfullyEarnLoot) await user.addGold(reward).save();

        await interaction.reply({
            content: this.isDestroyed
                ? "You can't enter the portal anymore... someone destroyed it!"
                : `You ${successfullyEnterdPortal ? "successfully" : "unsuccessfully"} entered the portal${!destroyedPortal ? "" : "! And accidentally destroyed the portal"}${!successfullyEarnLoot ? "!" : ` and you got ${reward} ${Globals.ATTRIBUTES.gold.emoji}`}`,
            flags: "Ephemeral",
        });
        if (destroyedPortal) Quest.end(this.name);
    }

    private async onPressDestroy(interaction: ButtonInteraction): Promise<void> {
        await interaction.reply({
            content: this.isDestroyed ? "You can't destroy the portal anymore... someone destroyed it!" : "You destroyed the portal!",
            flags: "Ephemeral",
        });
        if (this.isDestroyed == false) Quest.end(this.name);
    }

    public override async end() {
        this.isDestroyed = true;
        const embed = new EmbedBuilder()
            .setTitle("Unstable Portal")
            .setDescription("Someone... Destroyed the portal???")
            .setColor("#0099ff")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1382031141577425076/WEQ4VWpwSE5RPQ.png?ex=6849ac4d&is=68485acd&hm=4cc8f7af4c76a4fd083f4eafb50935fc5e07dec05be3c742b0c25336f33aee8f&",
            )
            .setURL(Globals.LINK);

        await this.message.edit({
            embeds: [embed],
        });
    }
}
