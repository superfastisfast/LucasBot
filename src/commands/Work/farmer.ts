import { ModalSubmitInteraction } from "discord.js";
import { AppModal } from "../../ui";
import { Globals } from "../..";
import { AppUser } from "@/user";
import { Profession } from "../work";

export default class StudentProfession extends Profession {
    constructor() {
        const patterns = [
            "🌱🌿",
            "🌱🌿🌱",
            "🌿🌱🌿",
            "🌱🌱🌿",
            "🌿🌱🌱",
            "🌱🌿🌱🌿",
            "🌿🌿🌱🌱",
            "🌱🌿🌾",
            "🌾🌿🌱",
            "🌱🌾🌱",
            "🌿🍃🌿",
            "🌿🌱🌾🌿",
            "🌱🌿🌱🌾",
            "🍃🌱🌿🍃",
            "🌿🍂🌱",
            "🌾🌿🍃",
            "🍂🌾🌿",
            "🌱🍂🌾🌿",
            "🍃🌱🍂",
            "🌿🌱🍂🌾",
            "🌾🌿🌱🍃",
            "🌱🍃🌿🌾",
            "🍂🌿🌱",
            "🌱🍂🌱🍃",
            "🌾🍃🌿",
        ];

        const pattern = patterns[Globals.random(0, patterns.length)] || "🌱";

        const modal = new AppModal(
            "Farmer",
            [
                {
                    name: `Plant the crops, pattern length is ${pattern.length}`,
                    value: `${pattern} ${pattern}`,
                    style: "Paragraph",
                },
            ],
            async (modal: AppModal, interaction: ModalSubmitInteraction) => {
                let reward: number = 0;

                const field = modal.getField(interaction, [...modal.fields.keys()][0]!);

                const chars = [...field];
                const patternLength = [...pattern].length;

                const user = await AppUser.fromID(interaction.user.id);

                for (let i = 0; i <= chars.length - patternLength; i += patternLength) {
                    const segment = chars.slice(i, i + patternLength).join("");
                    if (segment === pattern) reward += patternLength / (100 - (user.getStat("stamina") + user.getStat("strength")) / 25);
                }

                await user.addGold(reward).save();

                await interaction.reply({
                    content: `You planted some crops\n+${reward.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`,
                    flags: "Ephemeral",
                });
            },
        );

        super(modal);
    }
}
