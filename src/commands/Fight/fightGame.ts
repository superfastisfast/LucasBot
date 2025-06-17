import { AppButton } from "@/button";
import { Globals } from "@/index";
import type { AppUser } from "@/user";
import { ButtonInteraction, EmbedBuilder, InteractionResponse, type Message } from "discord.js";
import type Fighter from "./fighter";
import { getFightDisplay } from "./fieldGenerate";
import FightCommand from "../fight";

export default class FightGame {
    appUsers: AppUser[] = [];
    bet: number = 0;
    playerTurn: number = 0;
    arenaSize: number = 6;

    private static nextId: number = 0;
    id: number = 0;

    message!: Message<true>;
    buttonsInvite: AppButton[] = [new AppButton("Accept", this.onPressAccept.bind(this)), new AppButton("Decline", this.onPressDecline.bind(this))];
    buttonsAll: AppButton[] = [
        new AppButton("<<<", this.onPressMoveLeft.bind(this)),
        new AppButton("Attack", this.onPressAttack.bind(this)),
        new AppButton(">>>", this.onPressMoveRight.bind(this)),
        new AppButton("Sleep", this.onPressSleep.bind(this)),
    ];
    buttonsFleeLeft: AppButton[] = [
        new AppButton("Flee", this.onPressFlee.bind(this)),
        new AppButton("Attack", this.onPressAttack.bind(this)),
        new AppButton(">>>", this.onPressMoveRight.bind(this)),
        new AppButton("Sleep", this.onPressSleep.bind(this)),
    ];
    buttonsFleeRight: AppButton[] = [
        new AppButton("<<<", this.onPressMoveLeft.bind(this)),
        new AppButton("Attack", this.onPressAttack.bind(this)),
        new AppButton("Flee", this.onPressFlee.bind(this)),
        new AppButton("Sleep", this.onPressSleep.bind(this)),
    ];
    buttonsMana: AppButton[] = [new AppButton("Sleep", this.onPressDecline.bind(this))];

    public async onPressAccept(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        // console.log("interaction ID: " + interaction.user.id);
        // console.log("Player ID: " + this.appUsers[1]?.discord.id);
        if (!this.getAppUserByID(interaction.user.id) || interaction.user.id !== this.appUsers[1]?.discord.id)
            return interaction.reply({ content: `You are not the invited person`, flags: "Ephemeral" });
        const ret = interaction.reply({ content: `You accepted the fight`, flags: "Ephemeral" });
        let field = await getFightDisplay(this, "accepted");
        const actionRow = AppButton.createActionRow(this.buttonsAll);
        field.components = actionRow;
        this.message.edit(field);
        return ret;
    }
    public async onPressDecline(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        if (!this.getAppUserByID(interaction.user.id)) return interaction.reply({ content: `You are not part of the fight`, flags: "Ephemeral" });
        FightCommand.endGameByID(this.id);
        return interaction.reply({ content: `${interaction.user} Declined a fight` });
    }
    public async onPressMoveLeft(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        return interaction.reply({ content: `${interaction.user} Moved Left` });
    }
    public async onPressAttack(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        return interaction.reply({ content: `${interaction.user} Attacked` });
    }
    public async onPressMoveRight(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        return interaction.reply({ content: `${interaction.user} Moved Right` });
    }
    public async onPressSleep(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        return interaction.reply({ content: `${interaction.user} Sleep` });
    }
    public async onPressFlee(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        return interaction.reply({ content: `${interaction.user} Flee` });
    }
    // new ButtonBuilder().setCustomId("#end").setLabel("End Fight (TEST)").setStyle(ButtonStyle.Primary),

    constructor(discordUser1: AppUser, discordUser2: AppUser, amount: number) {
        this.id = FightGame.nextId++;
        this.bet = amount;
        this.appUsers = [discordUser1, discordUser2];
    }
    public async sendInviteMessage() {
        const builder = new EmbedBuilder()
            .setTitle(`:crossed_swords: ${this.appUsers[0]!.discord.displayName} -VS- ${this.appUsers[1]!.discord.displayName} :crossed_swords:`)
            .setDescription(`:moneybag:**Bet: ${this.bet}**\n${this.appUsers[1]!.discord} do you accept the fight?`)
            .setTimestamp();
        const actionRow = AppButton.createActionRow(this.buttonsInvite);
        this.message = await Globals.CHANNEL.send({
            embeds: [builder],
            components: actionRow,
        });
    }
    getAppUserByID(userId: string) {
        return this.appUsers.find((player) => player.discord.id === userId);
    }

    public gameOver() {
        this.message.edit({ content: "GameOver", embeds: [], components: [] });
    }

    getCurrentPlayer(): Fighter {
        return this.appUsers[this.playerTurn]!.fighter;
    }
    getNextPlayer(): Fighter {
        return this.appUsers[this.playerTurn === 0 ? 1 : 0]!.fighter;
    }
}
