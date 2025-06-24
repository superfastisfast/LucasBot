import { Message, type ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/ui";
import { AppUser } from "@/user";
import { Globals } from "..";

export default class RescueQuest extends Quest.Base {
    public override buttons: AppButton[] = [new AppButton("Rescue the villager", this.onPressRescue.bind(this))];

    players: string[] = [];
    maxPlayers: number = 3;

    difculty: number = Globals.random(1, 5);
    reward: number = this.difculty * 30;

    public override async start(): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons);
        const embed = new EmbedBuilder()
            .setTitle("Rescue Mission")
            .setDescription("A local villager has been kidnapped by a fearsome beast!")
            .setColor("#4CAF50")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1383443484333178931/iu.png?ex=684ecfa5&is=684d7e25&hm=b4d74322559c7db6d7a8c8ea90e8e567719ab7d203e5b9fbe1f6ab633d2ed5e5&",
            )
            .setURL(Globals.LINK);

        const lobby = new EmbedBuilder()
            .setTitle("Lobby")
            .setDescription(`0/${this.maxPlayers} players joined so far!`)
            .setColor("#4CAF50")
            .setURL(Globals.LINK);

        await Globals.CHANNEL.send({
            embeds: [embed],
        });

        return await Globals.CHANNEL.send({
            embeds: [lobby],
            components: actionRow,
        });
    }

    public override async end(): Promise<Quest.EndReturn> {
        const users: AppUser[] = [];
        for (const index in this.players) users.push(await AppUser.fromID(this.players[index]!));

        let playerStrength: number = 0;

        users.forEach((user) => {
            playerStrength += user.getStat("strength") + user.getStat("agility") + user.getStat("defense");
        });

        playerStrength = Globals.randomFloat(0, playerStrength);
        const beastStrengh = this.difculty * 9;

        const playersWon = playerStrength > beastStrengh;

        if (playersWon) users.forEach(async (user) => await user.addGold(this.reward).addXP(this.reward).addSkillPoints(0.5).save());
        else
            users.forEach(async (user) => {
                user.addGold(this.reward).save();
            });

        const embed = new EmbedBuilder()
            .setTitle("Result")
            .setDescription(
                users.length > 0
                    ? playersWon
                        ? `The players won over the beast! and got rewarded\n0.5x${Globals.ATTRIBUTES.skillpoint.emoji}\n${this.reward}${Globals.ATTRIBUTES.gold.emoji}\n${this.reward}${Globals.ATTRIBUTES.xp.emoji}`
                        : `The beast won over the players and ran away with the villager all players lost ${this.reward}${Globals.ATTRIBUTES.gold.emoji}` +
                          `\nBeast strengh: ${beastStrengh.toFixed(2)}, player strengh: ${playerStrength.toFixed(2)}`
                    : "No one joined",
            )
            .setColor("#4CAF50")
            .setURL(Globals.LINK)
            .toJSON();

        this.message.edit({
            embeds: [embed],
        });

        return Quest.end(this.name);
    }

    private async onPressRescue(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        for (const index in this.players) {
            if (user.discord.id == this.players[index]) {
                await interaction.reply({
                    content: `You are already in the lobby!`,
                    flags: "Ephemeral",
                });
                return;
            }
        }

        this.players.push(user.discord.id);

        await interaction.reply({
            content: `You have decided to join the rescue party for the villager!`,
            flags: "Ephemeral",
        });

        const lobby = new EmbedBuilder()
            .setTitle("Lobby")
            .setDescription(`${this.players.length}/${this.maxPlayers} players joined so far!`)
            .setColor("#4CAF50")
            .setURL(Globals.LINK)
            .toJSON();

        this.message.edit({
            embeds: [lobby],
        });

        if (this.players.length >= this.maxPlayers) Quest.end(this.name);
    }
}
