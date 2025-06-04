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
    players: Fighter[] = [];
    arenaSize: number = 6;
    playerTurn: number = 0;
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

    validateTurn(id: string): boolean {
        if (this.playerTurn == 0 && id === this.players[0]?.playerId) {
            this.playerTurn = 1;
            return true;
        } else if (this.playerTurn == 1 && id === this.players[1]?.playerId) {
            this.playerTurn = 0;
            return true;
        }
        return false;
    }

    public override async onButtonInteract(
        client: Client,
        interaction: ButtonInteraction,
    ): Promise<boolean> {
        if (
            interaction.user.id !== this.players[0]?.playerId &&
            interaction.user.id !== this.players[1]?.playerId
        ) {
            interaction.reply({
                content: "You are not part of this fight!",
                flags: "Ephemeral",
            });
            return true;
        }
        if (
            interaction.customId === "#moveLeft" &&
            this.validateTurn(interaction.user.id)
        ) {
            if (this.players[this.playerTurn]!.posX > 0) {
                this.players[this.playerTurn]!.posX -= 1;
                interaction.update(this.getFightDisplayOptions());
                return true;
            }
        } else if (
            interaction.customId === "#moveRight" &&
            this.validateTurn(interaction.user.id)
        ) {
            console.log(
                "Player " +
                    this.playerTurn +
                    " : " +
                    this.players[this.playerTurn]!.username +
                    " is moving right.",
            );
            if (this.players[this.playerTurn]!.posX < this.arenaSize - 1) {
                this.players[this.playerTurn]!.posX += 1;
                interaction.update(this.getFightDisplayOptions());
                return true;
            }
        } else if (
            interaction.customId === "#attack" &&
            this.validateTurn(interaction.user.id)
        ) {
            interaction.reply({
                content: `${this.players[this.playerTurn]!.username} attacks!`,
                flags: "Ephemeral",
            });
            return true;
        } else if (
            interaction.customId === "#acceptFight" &&
            interaction.user.id === this.players[1]?.playerId
        ) {
            interaction.update(this.getFightDisplayOptions());
            return true;
        } else if (interaction.customId === "#declineFight") {
            interaction.update({
                content: `The fight was cancelled by ${interaction.user.username}.`,
                components: [],
            });
            this.isActive = false;
            return true;
        } else if (interaction.customId === "#end") {
            interaction.update({
                content: `The fight was ended by ${interaction.user.username}.`,
                components: [],
            });
            this.isActive = false;
        }
        return false;
    }

    private getFightDisplayOptions() {
        let fieldArray: string[] = Array(this.arenaSize).fill("⬜");
        fieldArray[this.players[0]!.posX] = ":person_bald:";
        fieldArray[this.players[1]!.posX] = ":smirk_cat:";
        const builder = new EmbedBuilder()
            .setTitle(
                ":crossed_swords:" +
                    this.players[0]?.username +
                    " -VS- " +
                    this.players[1]?.username +
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
                    this.players[0]?.username +
                    " -VS- " +
                    this.players[1]?.username +
                    ":crossed_swords:",
            )
            .setDescription(
                this.players[1]?.username + " do you accept the fight?",
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

        this.players[0] = new Fighter(
            dbCommandUser.displayName,
            commandUser.id,
            0,
        );
        this.players[1] = new Fighter(
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
