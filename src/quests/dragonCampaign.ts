import { type Client, type ButtonInteraction, type Message, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";
import type { StatsModel } from "@/models/user";

export default class DragonCampaignQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map<string, AppButton>([
        ["Join", new AppButton("Join", this.onPressJoin.bind(this))],
    ]);

    players: string[] = [];

    public override async start(client: Client): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons, ["Join"])

        const embed = new EmbedBuilder()
            .setTitle("Dragon Campaign")
            .setDescription(
                `The ancient beast now haunts the skies of Lucamon\n
                casting shadows over villages and scorching the land with fire\n\n
                🛡️ Brave adventurers may answer the call\n
                💎 Great rewards await those who succeed — but beware: you will take damage if unprepared\n\n
                ⚔️ Combine your party's Strength, Magic, Agility, and Defense to stand a chance. Your teamwork determines the outcome:\n
                💀 Worst-case: All perish. No reward\n
                🌟 Best-case: No one is harmed\n\n
                Survivors gain legendary treasure. Dare to fight the beast — or watch Lucamon fall`
            )
            .setColor("#0099ff")
            .setImage("https://cdn.discordapp.com/attachments/1379101132743250082/1381274300987867216/CoolDragon.jpg?ex=6846eb70&is=684599f0&hm=a901607a7f42b3970f60320d16dee2c04ce655201aa8df64ef123829d5e0bc47&")
            .setURL("https://www.youtube.com/@LucasDevelop")
            .toJSON();

        await Quest.channel.send({
            embeds: [embed],
            components: actionRow,
        });
        return await Quest.channel.send({
            content: "No joined players yet",
        });
    }

    public override async end(): Promise<Quest.EndReturn> {
        const users: AppUser[] = [];
        for (const index in this.players)
            users.push(await AppUser.fromID(this.players[index]!))

        let playerStrength: number = 0

        users.forEach((user) => {
            const stats = user.database.stats;
            playerStrength += stats.strength + stats.agility + stats.stamina + stats.magicka + stats.defense + stats.vitality;
        })

        // TODO: Make balancing better maybe idk
        const avgStrength = playerStrength / users.length;

        const min = Math.max(10, playerStrength - users.length * users.length);
        const max = Math.max(min + 1, avgStrength * playerStrength * Math.abs(Math.sin(Math.random())));

        const dragonStrength = Math.floor(((Math.random() * (max - min + 1)) + min) / 4);

        const playersWon = playerStrength > dragonStrength;

        if (playersWon) users.forEach(async (user) => {
            await user
                .addSkillPoints(1)
                .addXP(Math.floor(Math.random() * 50 * user.database.stats.charisma))
                .addGold(Math.floor(Math.random() * 50 * user.database.stats.charisma))
                .save();
        })

        const embed = new EmbedBuilder()
            .setTitle("Dragon Campaign Results")
            .setDescription(
                `${playersWon ? "The players won over the dragon!" : "The dragon won against the players"}\n
                Player strengh was ${playerStrength}, dragon strengh was ${dragonStrength}`)
            .setColor("#0099ff")
            .setURL("https://www.youtube.com/@LucasDevelop")
            .toJSON();

        this.message.edit({
            embeds: [embed],
        })
        
        return Quest.end(this.name);
    }

    private async onPressJoin(interaction: ButtonInteraction): Promise<void> {
        this.players.push(interaction.user.id)
        await interaction.reply({
            content: `You joined the campaign!`,
            flags: 'Ephemeral',
        });

        let joinedPlayerString: string = "";
        for (const index in this.players)
            joinedPlayerString += `${(await AppUser.fromID(this.players[index]!)).discord}, `

        const joinedPlayersEmbed = new EmbedBuilder()
            .setTitle("Dragon Campaign Lobby")
            .setDescription(`Players: ${joinedPlayerString}`)
            .setColor("#0099ff")
            .setURL("https://www.youtube.com/@LucasDevelop")
            .toJSON();


        this.message.edit({
            content: "",
            embeds: [joinedPlayersEmbed],
        })
    }
}
