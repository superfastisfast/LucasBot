import { Command } from "@/command";
import { giveGold } from "@/models/user";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
    type Client,
    type CommandInteraction,
    type Interaction,
    type InteractionReplyOptions,
    type InteractionUpdateOptions,
} from "discord.js";

class Fighter {
    username: string = "username";
    posX: number = 0;

    constructor(username: string, posX: number) {
        this.username = username;
        this.posX = posX;
    }
}
//TODO list of active fights; Becaouse otherwise there is only one running.

export default class FightCommand extends Command {
    player1?: Fighter;
    arenaSize: number = 6;
    // player2?: Fighter;
    override get info(): any {
        console.log("Fight called");

        return new SlashCommandBuilder()
            .setName("fight")
            .setDescription("fight a player")
            .toJSON();
    }

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (interaction.customId === "#moveLeft") {
            if (this.player1!.posX > 0) {
                this.player1!.posX -= 1;
                interaction.update(this.getFightDisplayOptions());
                return true;
            }
        } else if (interaction.customId === "#moveRight") {
            if (this.player1!.posX < this.arenaSize - 1) {
                this.player1!.posX += 1;
                interaction.update(this.getFightDisplayOptions());
                return true;
            }
        } else if (interaction.customId === "#attack") {
            interaction.reply({
                content: `${this.player1!.username} attacks!`,
                flags: "Ephemeral",
            });
            return true;
        }
        return false;
    }

    private getFightDisplayOptions() {
        let fieldArray: string[] = Array(this.arenaSize).fill("⬜");
        fieldArray[this.player1!.posX] = ":person_bald:";
        console.log(this.player1!.posX);
        console.log(fieldArray);
        const builder = new EmbedBuilder()
            .setTitle("Fighting")
            .setDescription("Field:\n " + fieldArray.join(""))
            .setTimestamp();
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("#moveLeft")
                .setLabel("<<<")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("#attack")
                .setLabel("Attack")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("#moveRight")
                .setLabel(">>>")
                .setStyle(ButtonStyle.Primary),
        );

        return {
            embeds: [builder],
            components: [actionRow],
        };
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        this.player1 = new Fighter(interaction.member?.user.username!, 0);
        let msg = this.getFightDisplayOptions();
        interaction.reply({
            embeds: msg.embeds,
            components: msg.components,
            flags: "Ephemeral",
        });
    }
}
