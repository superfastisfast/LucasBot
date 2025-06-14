import { type Client, Message, type ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";

export default class RescueQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map<string, AppButton>([
        ["Rescue", new AppButton("Rescue the villager", this.onPressRescue.bind(this))],
    ]);

    players: string[] = [];
    maxPlayers: number = 3;

    maxGoldReward: number = 300;
    minGoldReward: number = 50;

    public override async start(): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons, ["Rescue"]);
        const embed = new EmbedBuilder()
            .setTitle("Rescue Mission")
            .setDescription("A local villager has been kidnapped by a fearsome beast!")
            .setColor("#4CAF50")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1383443484333178931/iu.png?ex=684ecfa5&is=684d7e25&hm=b4d74322559c7db6d7a8c8ea90e8e567719ab7d203e5b9fbe1f6ab633d2ed5e5&",
            )
            .setURL(Quest.link)
            .toJSON();

        const lobby = new EmbedBuilder()
            .setTitle("Lobby")
            .setDescription("0/3 players joined so far!")
            .setColor("#4CAF50")
            .setURL(Quest.link)
            .toJSON();

        await Quest.channel.send({
            embeds: [embed],
        });

        return await Quest.channel.send({
            embeds: [lobby],
            components: actionRow,
        });
    }

    public override async end(): Promise<Quest.EndReturn> {
        const users: AppUser[] = [];
        for (const index in this.players) users.push(await AppUser.fromID(this.players[index]!));

        let playerStrength: number = 0;

        users.forEach((user) => {
            const stats = user.database.stats;
            playerStrength += stats.strength + stats.agility + stats.defense;
        });

        const beastStrengh = Math.floor(Math.random() * playerStrength) + users.length * 25;

        const playersWon = playerStrength > beastStrengh;

        if (playersWon)
            users.forEach(
                async (user) =>
                    await user
                        .addGold(
                            Math.floor(Math.random() * (this.maxGoldReward - this.minGoldReward)) + this.minGoldReward,
                        )
                        .addXP(100)
                        .save(),
            );
        else
            users.forEach(async (user) => {
                user.database.stats.strength = Math.max(0, user.database.stats.strength - 1);
                await user.save();
            });

        const embed = new EmbedBuilder()
            .setTitle("Result")
            .setDescription(
                playersWon
                    ? `The players won over the beast!`
                    : `The beast won over the players and ran away with the villager` +
                          `\nBeast strengh: ${beastStrengh}, player strengh: ${playerStrength}`,
            )
            .setColor("#4CAF50")
            .setURL(Quest.link)
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
            .setDescription(`${this.players.length}/3 players joined so far!`)
            .setColor("#4CAF50")
            .setURL(Quest.link)
            .toJSON();

        this.message.edit({
            embeds: [lobby],
        });

        if (this.players.length >= this.maxPlayers) this.end();
    }
}
