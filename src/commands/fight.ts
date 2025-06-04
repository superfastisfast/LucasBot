import { Command } from "@/command";
import { getUserFromId, giveGold } from "@/models/user";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
    type Client,
    type CommandInteraction,
} from "discord.js";

class Fighter {
    username: string = "username";
    playerId: string = "playerId";
    posX: number = 0;

    constructor(username: string, playerID: string, posX: number) {
        this.username = username;
        this.playerId = playerID;
        this.posX = posX;
    }
}
//TODO list of active fights; Becaouse otherwise there is only one running.

export default class FightCommand extends Command {
    isActive: boolean = false;
    player1?: Fighter;
    player2?: Fighter;
    arenaSize: number = 6;
    player1Turn: boolean = true;
    override get info(): any {
        console.log("Fight called");

        return new SlashCommandBuilder()
            .setName("fight")
            .setDescription("fight a player")
            .addUserOption((option) =>
                option
                    .setName("opponent")
                    .setDescription("The opponent to fight")
                    .setRequired(true),
            )
            .toJSON();
    }

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (
            interaction.user.id !== this.player1?.playerId &&
            interaction.user.id !== this.player2?.playerId
        ) {
            interaction.reply({
                content: "You are not part of this fight!",
                flags: "Ephemeral",
            });
            return true;
        }
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
        } else if (
            interaction.customId === "#acceptFight" &&
            interaction.user.id === this.player2?.playerId
        ) {
            interaction.update(this.getFightDisplayOptions());
            return true;
        } else if (interaction.customId === "#declineFight") {
            interaction.update({
                content: `The fight was cancelled by ${interaction.user.username}.`,
                components: [],
            });
            this.isActive = false;
            this.player1 = undefined;
            this.player2 = undefined;
            return true;
        } else if (interaction.customId === "#end") {
            interaction.update({
                content: `The fight was ended by ${interaction.user.username}.`,
                components: [],
            });
            this.isActive = false;
            this.player1 = undefined;
            this.player2 = undefined;
        }
        return false;
    }

    private getFightDisplayOptions() {
        let fieldArray: string[] = Array(this.arenaSize).fill("⬜");
        fieldArray[this.player1!.posX] = ":person_bald:";
        fieldArray[this.player2!.posX] = ":smirk_cat:";
        const builder = new EmbedBuilder()
            .setTitle(
                ":crossed_swords:" +
                    this.player1?.username +
                    " -VS- " +
                    this.player2?.username +
                    ":crossed_swords:",
            )
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
            new ButtonBuilder()
                .setCustomId("#end")
                .setLabel("End Fight (TEST)")
                .setStyle(ButtonStyle.Primary),
        );

        return {
            embeds: [builder],
            components: [actionRow],
        };
    }

    private InitiateFight() {
        const builder = new EmbedBuilder()
            .setTitle(
                ":crossed_swords:" +
                    this.player1?.username +
                    " -VS- " +
                    this.player2?.username +
                    ":crossed_swords:",
            )
            .setDescription(
                this.player2?.username + " do you accept the fight?",
            )
            .setTimestamp();
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("#acceptFight")
                .setLabel("Accept Fight")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("#declineFight")
                .setLabel("Decline Fight")
                .setStyle(ButtonStyle.Danger),
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
        if (this.isActive) {
            interaction.reply({
                content: "A fight is already in progress!",
                flags: "Ephemeral",
            });
            return;
        }
        const commandUser = interaction.user;
        const opponentUser =
            interaction.options.get("opponent")?.user || commandUser;
        if (commandUser === opponentUser) {
            interaction.reply({
                content: "You cannot fight yourself!",
                flags: "Ephemeral",
            });
            return;
        }
        this.isActive = true;

        const dbCommandUser = await getUserFromId(commandUser.id);
        const dbOpponentUser = await getUserFromId(opponentUser.id);

        this.player1 = new Fighter(
            dbCommandUser.displayName,
            commandUser.id,
            0,
        );
        this.player2 = new Fighter(
            dbOpponentUser.displayName,
            opponentUser.id,
            this.arenaSize - 1,
        );

        let msg = this.InitiateFight();
        interaction.reply({
            embeds: msg.embeds,
            components: msg.components,
        });
    }
}
