import { DataBase } from "@/models/user";
import { Quest } from "@/quest";
import { AppUser } from "@/user";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    type Client,
    type TextChannel,
} from "discord.js";

export default class UnstablePortalQuest extends Quest.Base {
    goldReward: number = 10;
    questData: Quest.Data = {
        title: "Unstable Portal",
        imageUrl:
            "https://cdn.discordapp.com/attachments/1379101132743250082/1382031141577425076/WEQ4VWpwSE5RPQ.png?ex=6849ac4d&is=68485acd&hm=4cc8f7af4c76a4fd083f4eafb50935fc5e07dec05be3c742b0c25336f33aee8f&",
        description:
            "A shimmering portal has appeared! Strange energy pulses from within. Try to enter the portal based on ✨magic. Or destroy the portal and receive a reward 100% success rate",
    };
    interactedPlayerIds: Array<string> = [];
    isPortalActive: boolean = true;
    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (!this.isPortalActive) {
            await interaction.reply({
                content: `The portal is destroyed.`,
                flags: "Ephemeral",
            });
            return true;
        }
        if (
            interaction.customId === `#${this.generateUniqueButtonID()}_enter`
        ) {
            if (
                !interaction.user ||
                this.interactedPlayerIds.includes(interaction.user.id)
            ) {
                await interaction.reply({
                    content: `You cant enter the portal anymore... someone destroyed it!`,
                    flags: "Ephemeral",
                });
                return true;
            } else {
                this.interactedPlayerIds.push(interaction.user.id);
                const user = await AppUser.createFromID(interaction.user.id);

                const randVal: number = Math.random();
                const rolled =
                    AppUser.rollRandomDice(
                        user.database.stats.magicka / 2,
                        user.database.stats.magicka,
                    ) / 100;
                const success: boolean = rolled > randVal;
                if (success) {
                    user.database.portalsEntered += 1;
                    await user.database.save();
                }
                await interaction.reply({
                    content: `You ${success ? "succeeded" : "failed"} to enter the portal.\nYou rolled ${rolled.toFixed(2)} against ${randVal.toFixed(2)} `,
                    flags: "Ephemeral",
                });
                return true;
            }
        } else if (
            interaction.customId === `#${this.generateUniqueButtonID()}_destroy`
        ) {
            this.isPortalActive = false;
            await interaction.deferUpdate();
            await interaction.editReply({ components: [] });
            await interaction.followUp({
                content: `You recived ${this.goldReward} gold for destroying the portal! The uknown thanks you...`,
                flags: "Ephemeral",
            });
            const user = await AppUser.createFromID(interaction.user.id);
            user.addGold(this.goldReward);
            return true;
        }

        return false;
    }

    private async generateQuestBody() {
        const builder = new EmbedBuilder()
            .setTitle(this.questData.title)
            .setDescription(this.questData.description)
            .setColor("#0099ff")
            .setImage(this.questData.imageUrl)
            .setURL("https://www.youtube.com/@LucasDevelop")
            .setFooter(this.footerText);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_enter`)
                .setLabel("Try to enter the portal? (???)")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`#${this.generateUniqueButtonID()}_destroy`)
                .setLabel("Destroy the portal")
                .setStyle(ButtonStyle.Primary),
        );
        return {
            embeds: [builder],
            components: [actionRow],
        };
    }

    public override async startQuest(client: Client): Promise<void> {
        this.generateEndDate(1000 * 60 * 10);
        this.generateFooter();
        this.interactedPlayerIds = [];
        this.isPortalActive = true;
        if (!process.env.QUEST_CHANNEL_ID)
            throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        let questChannel: TextChannel = (await client.channels.fetch(
            process.env.QUEST_CHANNEL_ID,
        )) as TextChannel;

        const questMsg = await this.generateQuestBody();

        let msg = await questChannel.send(questMsg);
    }
}
