import { type ButtonInteraction, type Message, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/ui";
import { AppUser } from "@/user";
import { Globals } from "..";

export default class DragonCampaignQuest extends Quest.Base {
    public override buttons: AppButton[] = [new AppButton("Join", this.onPressJoin.bind(this))];

    players: string[] = [];
    difculty: number = Globals.random(1, 5);
    reward: number = this.difculty * 10;

    public override async start(): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons);

        const embed = new EmbedBuilder()
            .setTitle("Dragon Campaign")
            .setDescription(
                `The ancient beast now haunts the skies of Lucamon\n
                casting shadows over villages and scorching the land with fire\n\n
                🛡️ Brave adventurers may answer the call\n
                💎 Great rewards await those who succeed\n\n
                ⚔️ Combine your party's Strength, Magic, Agility, and Defense to stand a chance. Your teamwork determines the outcome:\n
                Survivors gain legendary treasure. Dare to fight the beast — or watch Lucamon fall`,
            )
            .setColor("#FF4500")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1381274300987867216/CoolDragon.jpg?ex=6846eb70&is=684599f0&hm=a901607a7f42b3970f60320d16dee2c04ce655201aa8df64ef123829d5e0bc47&",
            )
            .setURL(Globals.LINK);

        const lobby = new EmbedBuilder().setTitle("Lobby").setDescription("No players have joined yet!").setColor("#FF4500").setURL(Globals.LINK);

        await Globals.CHANNEL.send({
            embeds: [embed],
        });
        return await Globals.CHANNEL.send({
            embeds: [lobby],
            components: actionRow,
        });
    }

    public override async end() {
        const users: AppUser[] = [];
        for (const index in this.players) users.push(await AppUser.fromID(this.players[index]!));

        let playerStrength: number = 0;

        users.forEach((user) => {
            const stats = user.database.stats;
            playerStrength +=
                user.getStat("strength") +
                user.getStat("agility") +
                user.getStat("stamina") +
                user.getStat("charisma") +
                user.getStat("magicka") +
                user.getStat("defense") +
                user.getStat("vitality");
        });

        const dragonStrength = 7 * this.difculty * 10;

        const playersWon = playerStrength > dragonStrength;

        const message = !playersWon
            ? "The dragon won against the players"
            : `The players won over the dragon!\nRewards:\n1x${Globals.ATTRIBUTES.skillpoint.emoji}\n${this.reward}${Globals.ATTRIBUTES.gold.emoji}\n${this.reward}${Globals.ATTRIBUTES.xp.emoji}\n (Bonus for ${Globals.ATTRIBUTES.charisma.emoji})`;
        if (playersWon) {
            users.forEach(async (user) => {
                await user
                    .addSkillPoints(1)
                    .addXP(this.reward + user.getStat("charisma"))
                    .addGold(this.reward + user.getStat("charisma"))
                    .save();
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("Result")
            .setDescription(
                users.length > 0
                    ? `${message}\n
                Player strengh was ${playerStrength.toFixed(2)}, dragon strengh was ${dragonStrength.toFixed(2)}`
                    : "No one joined",
            )
            .setColor("#FF4500")
            .setURL(Globals.LINK)
            .toJSON();

        this.message.edit({
            embeds: [embed],
        });
    }

    private async onPressJoin(interaction: ButtonInteraction): Promise<void> {
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
            content: `You joined the campaign!`,
            flags: "Ephemeral",
        });

        let joinedPlayerString: string = "";

        for (const index in this.players) joinedPlayerString += `${(await AppUser.fromID(this.players[index]!)).discord}, `;

        const joinedPlayersEmbed = new EmbedBuilder()
            .setTitle("Lobby")
            .setDescription(`Players: ${joinedPlayerString}`)
            .setColor("#FF4500")
            .setURL(Globals.LINK)
            .toJSON();

        this.message.edit({
            embeds: [joinedPlayersEmbed],
        });
    }
}
