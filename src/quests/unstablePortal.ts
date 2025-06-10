import { DataBase } from "@/models/user";
import { Quest } from "@/quest";
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
                const dbUser = await DataBase.getDBUserFromUser(
                    interaction.user,
                );
                const randVal: number = Math.random();
                const success: boolean = dbUser.stats.magicka / 100 > randVal;
                if (success) {
                    dbUser.portalsEntered += 1;
                    await dbUser.save();
                }
                await interaction.reply({
                    content: `You ${success ? "succeeded" : "failed"} to enter the portal.\nYou rolled ${(dbUser.stats.magicka / 100).toFixed(2)} against ${randVal.toFixed(2)} `,
                    flags: "Ephemeral",
                });
                return true;
            }
        } else if (
            interaction.customId === `#${this.generateUniqueButtonID()}_destroy`
        ) {
            this.isPortalActive = false;
            await interaction.reply({
                content: `You destroyed the portal.`,
                flags: "Ephemeral",
            });
            return true;
        }

        return false;
    }

    private async generateQuestBody() {
        const questData = await this.getQuestData();
        const builder = new EmbedBuilder()
            .setTitle(questData.title)
            .setDescription(questData.description.replace(/\\n/g, "\n"))
            .setColor("#0099ff")
            .setImage(questData.imageUrl)
            .setURL("https://www.youtube.com/@LucasDevelop")
            .setFooter({
                text:
                    "Quest Ends: " +
                    this.endDate?.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    }),
            });

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
