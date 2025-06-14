import { type Client, Message, type ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/button";
import { AppUser } from "@/user";

export default class SubscribePortalQuest extends Quest.Base {
    public override buttons: Map<string, AppButton> = new Map<string, AppButton>([
        ["Red", new AppButton("Red 🔴", this.onPressRed.bind(this))],
        ["Blue", new AppButton("Blue 🔵", this.onPressBlue.bind(this))],
    ]);

    bet: number = 5;
    teams: Map<string, string> = new Map();
    private winningTeam: "red" | "blue" | null = null;

    public override async start(client: Client): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons, ["Red", "Blue"])
        const embed = new EmbedBuilder()
            .setTitle("Red vs Blue")
            .setDescription(`Pick a color costs ${this.bet} gold to participate. Winners split the won amount!`)
            .setColor("#800080")
            .setImage("https://cdn.discordapp.com/attachments/1379101132743250082/1382038199978688603/RedVsBlue.png?ex=6849b2df&is=6848615f&hm=bf4a2d2384a06f05254a556bc21afa61d7dc3ef327b0cb224dec387fb0650341&")
            .setURL("https://www.youtube.com/@LucasDevelop")
            .toJSON();

        return await Quest.channel.send({
            embeds: [embed],
            components: actionRow,
        });
    }

    public override async end(): Promise<Quest.EndReturn> {
        if (!this.winningTeam) this.winningTeam = Math.random() > 0.5 ? "red" : "blue";

        let winTeam: string = "";
        let loseTeam: string = "";

        for (const teammate of this.teams) {
            if (!teammate) {
                console.warn(`Player with '${teammate?.[0]}' id in team '${teammate?.[1]}' is undefined`);
                continue;
            }
        
            const user = await AppUser.fromID(teammate[0] || "");
        
            if (teammate[1] === this.winningTeam) {
                await user.addGold(this.bet).save();
                winTeam += `${user.discord}, `;
            } else {
                await user.addGold(-this.bet).save();
                loseTeam += `${user.discord}, `;
            }
        }


        const embed = new EmbedBuilder()
            .setTitle(`Team ${this.winningTeam} wins!`)
            .setDescription(`Winning team: ${winTeam}\nLosing team: ${loseTeam}`)
            .setColor(this.winningTeam === "red" ? "#FF0000" : "#0000FF")
            .setURL("https://www.youtube.com/@LucasDevelop")
            .toJSON();

        this.message.edit({
            embeds: [embed],
        }) 

        return Quest.end(this.name)
    }

    private async onPressRed(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);
        if (user.database.inventory.gold < this.bet) {
            await interaction.reply({
                content: `You do not have enough gold to participate, the required amount is ${this.bet} and you have ${user.database.inventory.gold}`,
                flags: 'Ephemeral',
            });
            return;
        }

        const currentUserTeam = this.teams.get(user.discord.id);

        if (currentUserTeam) {
            await interaction.reply({
                content: `You're already in team ${currentUserTeam}!`,
                flags: 'Ephemeral',
            });
            return;
        }

        this.teams.set(user.discord.id, "red");

        await interaction.reply({
            content: `You joined team red!`,
            flags: 'Ephemeral',
        });
    }

    private async onPressBlue(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);
        if (user.database.inventory.gold < this.bet) {
            await interaction.reply({
                content: `You do not have enough gold to participate, the required amount is ${this.bet} and you have ${user.database.inventory.gold}`,
                flags: 'Ephemeral',
            });
            return;
        }

        const currentUserTeam = this.teams.get(user.discord.id);

        if (currentUserTeam) {
            await interaction.reply({
                content: `You're already in team ${currentUserTeam}!`,
                flags: 'Ephemeral',
            });
            return;
        }

        this.teams.set(user.discord.id, "blue");

        await interaction.reply({
            content: `You joined team blue!`,
            flags: 'Ephemeral',
        });
    }
}
