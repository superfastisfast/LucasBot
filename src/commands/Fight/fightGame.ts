import { AppButton } from "@/button";
import { Globals } from "@/index";
import { AppUser } from "@/user";
import { ButtonInteraction, EmbedBuilder, InteractionResponse, type Message } from "discord.js";
import type Fighter from "./fighter";
import { getFightDisplay } from "./fieldGenerate";
import FightCommand from "../fight";

export default class FightGame {
    appUsers: AppUser[] = [];
    bet: number = 0;
    playerTurn: number = 1;
    arenaSize: number = 6;
    gameOverMsg: string = "";
    winner?: AppUser = undefined;

    private static nextId: number = 0;
    id: number = 0;

    constructor(discordUser1: AppUser, discordUser2: AppUser, amount: number) {
        this.id = FightGame.nextId++;
        this.bet = amount;
        this.appUsers = [discordUser1, discordUser2];
        discordUser1.fighter.posX = 0;
        discordUser2.fighter.posX = this.arenaSize - 1;
    }

    message!: Message<true>;
    buttonsInvite: AppButton[] = [new AppButton("Accept", this.onPressAccept.bind(this)), new AppButton("Decline", this.onPressDecline.bind(this))];
    buttonflee = new AppButton("Flee", this.onPressFlee.bind(this));
    buttonMoveLeft = new AppButton("<<<", this.onPressMoveLeft.bind(this));
    buttonAttack = new AppButton("Attack", this.onPressAttack.bind(this));
    buttonMoveRight = new AppButton(">>>", this.onPressMoveRight.bind(this));
    buttonSleep = new AppButton("Sleep", this.onPressSleep.bind(this));
    // buttonEnd = new AppButton("End", this.onPressSleep.bind(this));

    private getActionButtons(): AppButton[] {
        let buttons: AppButton[] = [];
        const nextPlayer = this.getNextPlayer();
        if (nextPlayer.currentMana < 1) return [this.buttonSleep];
        nextPlayer.posX === 0 ? buttons.push(this.buttonflee) : buttons.push(this.buttonMoveLeft);
        buttons.push(this.buttonAttack);
        nextPlayer.posX === this.arenaSize - 1 ? buttons.push(this.buttonflee) : buttons.push(this.buttonMoveRight);
        buttons.push(this.buttonSleep);
        return buttons;
    }

    public async onPressAccept(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        if (!this.getAppUserByID(interaction.user.id) || interaction.user.id !== this.appUsers[1]?.discord.id)
            return interaction.reply({ content: `You are not the invited person`, flags: "Ephemeral" });
        const ret = interaction.reply({ content: `You accepted the fight`, flags: "Ephemeral" });
        let field = await getFightDisplay(this, "accepted");
        const actionRow = AppButton.createActionRow(this.getActionButtons());
        field.components = actionRow;
        this.message.edit(field);
        this.nextTurn();
        this.appUsers[0]!.addGold(-this.bet).save();
        this.appUsers[1]!.addGold(-this.bet).save();
        return ret;
    }
    public async onPressDecline(interaction: ButtonInteraction): Promise<InteractionResponse<true>> {
        if (!this.getAppUserByID(interaction.user.id)) return interaction.reply({ content: `You are not part of the fight`, flags: "Ephemeral" });
        FightCommand.endGameByID(this.id);
        return interaction.reply({ content: `${interaction.user} Declined a fight` });
    }

    /////////////////////////////////////////////////////////
    ///                     Fighting                       //
    /////////////////////////////////////////////////////////
    public async onPressMoveLeft(interaction: ButtonInteraction): Promise<InteractionResponse<true> | void> {
        if ((await this.validateActionTurn(interaction)) !== undefined) return;
        interaction.deferUpdate();

        this.getCurrentPlayer().move("left", this.arenaSize);

        let field = await getFightDisplay(this, "Moved Left");
        const actionRow = AppButton.createActionRow(this.getActionButtons());
        field.components = actionRow;
        this.message.edit(field);
        this.nextTurn();
    }
    public async onPressAttack(interaction: ButtonInteraction): Promise<InteractionResponse<true> | void> {
        if ((await this.validateActionTurn(interaction)) !== undefined) return;
        interaction.deferUpdate();

        const msg = this.getCurrentPlayer().attack(this.getNextPlayer());

        if (this.getNextPlayer().currentHealth <= 0) {
            this.winner = this.getCurrentPlayer().appUser;
            this.gameOverMsg = `**Defeated: ${this.getNextPlayer().appUser.discord.displayName}**`;
            FightCommand.endGameByID(this.id);
            return;
        }

        let field = await getFightDisplay(this, msg);
        const actionRow = AppButton.createActionRow(this.getActionButtons());
        field.components = actionRow;
        this.message.edit(field);
        this.nextTurn();
    }
    public async onPressMoveRight(interaction: ButtonInteraction): Promise<InteractionResponse<true> | void> {
        if ((await this.validateActionTurn(interaction)) !== undefined) return;
        interaction.deferUpdate();

        this.getCurrentPlayer().move("right", this.arenaSize);

        let field = await getFightDisplay(this, "Moved Right");
        const actionRow = AppButton.createActionRow(this.getActionButtons());
        field.components = actionRow;
        this.message.edit(field);
        this.nextTurn();
    }
    public async onPressSleep(interaction: ButtonInteraction): Promise<InteractionResponse<true> | void> {
        if ((await this.validateActionTurn(interaction)) !== undefined) return;
        interaction.deferUpdate();

        const msg = this.getCurrentPlayer().sleep();

        let field = await getFightDisplay(this, msg);
        const actionRow = AppButton.createActionRow(this.getActionButtons());
        field.components = actionRow;
        this.message.edit(field);
        this.nextTurn();
    }
    public async onPressFlee(interaction: ButtonInteraction): Promise<InteractionResponse<true> | void> {
        if ((await this.validateActionTurn(interaction)) !== undefined) return;
        interaction.deferUpdate();

        const fleeSuccess = this.getCurrentPlayer().flee();

        if (fleeSuccess) {
            this.gameOverMsg = "**Escaped the match**";
            FightCommand.endGameByID(this.id);
            return;
        }
        let field = await getFightDisplay(this, "Tried to flee");
        const actionRow = AppButton.createActionRow(this.getActionButtons());
        field.components = actionRow;
        await this.message.edit(field);
        this.nextTurn();
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

    async validateActionTurn(interaction: ButtonInteraction): Promise<InteractionResponse<true> | undefined> {
        if (!this.getAppUserByID(interaction.user.id))
            return await interaction.reply({ content: `You are not part of the fight!`, flags: "Ephemeral" });
        if (this.getCurrentPlayer().appUser.discord.id !== interaction.user.id)
            return await interaction.reply({ content: `It is not your turn!`, flags: "Ephemeral" });
        return undefined;
    }

    getAppUserByID(userId: string) {
        return this.appUsers.find((player) => player.discord.id === userId);
    }

    public async gameOver() {
        if (this.winner !== undefined) {
            (await AppUser.fromID(this.winner.discord.id)).addGold(this.bet * 2).save();
            this.gameOverMsg += `\nand gained the prize of ${this.bet * 2}${Globals.ATTRIBUTES.gold.emoji}`;
        } else {
            for (const user of this.appUsers) {
                (await AppUser.fromID(user.discord.id)).addGold(this.bet).save();
            }
            this.gameOverMsg += `\neach player got their bet back ${this.bet}${Globals.ATTRIBUTES.gold.emoji}`;
        }
        const endMsg = await getFightDisplay(this, this.gameOverMsg);
        this.message.edit({ content: "# **GameOver**", embeds: endMsg.embeds, components: [] });
    }

    getCurrentPlayer(): Fighter {
        return this.appUsers[this.playerTurn]!.fighter;
    }
    getNextPlayer(): Fighter {
        return this.appUsers[this.playerTurn === 0 ? 1 : 0]!.fighter;
    }
    nextTurn() {
        this.playerTurn = this.playerTurn === 0 ? 1 : 0;
    }
}
