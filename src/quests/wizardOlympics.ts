import { Message, ButtonInteraction, EmbedBuilder } from "discord.js";
import { Quest } from "@/quest";
import { AppButton } from "@/ui";
import { AppUser } from "@/user";
import { Globals } from "..";

export default class WizardOlympicsQuest extends Quest.Base {
    public override buttons: AppButton[] = [new AppButton("Participate", this.onPressParticipate.bind(this))];

    public override maxTimeActiveMS: number = 1000 * 60 * 17.68;

    participants: string[] = [];

    public override async start(): Promise<Message<true>> {
        const actionRow = AppButton.createActionRow(this.buttons);

        const embed = new EmbedBuilder()
            .setTitle("The Wizard Olympics")
            .setDescription(
                `The Wizard Olympics! Brought to you by Lucas Inc\nTo win you need to have\nagility ${Globals.ATTRIBUTES.agility.emoji},\ncharisma ${Globals.ATTRIBUTES.charisma.emoji}\nand most important\nMAGICKA ${Globals.ATTRIBUTES.magicka.emoji}!!`,
            )
            .setColor("#D22B2B")
            .setImage(
                "https://cdn.discordapp.com/attachments/1379101132743250082/1388565145432883372/running-track-500x500.png?ex=68617190&is=68602010&hm=63e22aaa12756c05955174e7d37ef678a8f9a2e38ecbc4fb0ade3bfdbe02bd9c&",
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

    public override async end(): Promise<Quest.EndReturn> {
        const participantStrengh: Map<string, number> = new Map();

        for (const participant of this.participants) {
            const user = await AppUser.fromID(participant);
            const strengh = user.getStat("agility") + user.getStat("charisma") + user.getStat("magicka") * 2;

            await user.addXP(strengh).save();

            participantStrengh.set(participant, strengh);
        }

        const sortedParticipants = new Map([...participantStrengh.entries()].sort((a, b) => b[1] - a[1]));

        const reward: number = 1;

        let resultString: string = "";
        for (let i: number = 0; i < 3; i++) {
            const person = [...sortedParticipants.entries()].length > i ? await AppUser.fromID([...sortedParticipants.keys()][i] || "") : null;

            if (person) await person.addSkillPoints(reward / (i + 1)).save();

            resultString += person ? `#${i + 1} ${person.discord} +${reward / (i + 1)} ${Globals.ATTRIBUTES.skillpoint.emoji}\n` : "";
        }

        const embed = new EmbedBuilder()
            .setTitle("Result")
            .setDescription(resultString.length > 0 ? `Everyone got XP\n🏆 Leaderboard\n${resultString}` : "No one joined")
            .setColor("#D22B2B")
            .setURL(Globals.LINK)
            .toJSON();

        this.message.edit({
            embeds: [embed],
        });

        return Quest.end(this.name);
    }

    private async onPressParticipate(interaction: ButtonInteraction): Promise<void> {
        const user = await AppUser.fromID(interaction.user.id);

        for (const index in this.participants) {
            if (user.discord.id == this.participants[index]) {
                await interaction.reply({
                    content: `You are already participants in the wizard olympics!`,
                    flags: "Ephemeral",
                });
                return;
            }
        }

        this.participants.push(user.discord.id);
        await interaction.reply({
            content: `You are going to participate in the wizard olympics this evening!`,
            flags: "Ephemeral",
        });

        let joinedPlayerString: string = "";

        for (const index in this.participants) joinedPlayerString += `${(await AppUser.fromID(this.participants[index]!)).discord}, `;

        const joinedPlayersEmbed = new EmbedBuilder()
            .setTitle("Lobby")
            .setDescription(`Participants: ${joinedPlayerString}`)
            .setColor("#D22B2B")
            .setURL(Globals.LINK)
            .toJSON();

        this.message.edit({
            embeds: [joinedPlayersEmbed],
        });
    }
}
