import { CommandInteraction, Emoji, InteractionResponse, ModalSubmitInteraction } from "discord.js";
import { AppModal } from "../../ui";
import { Globals } from "../..";
import { AppUser } from "@/user";
import { Profession } from "../work";

export interface FarmTheme {
    seed: string;
    weed: string;
}

export default class Farmer extends Profession {
    static themes: FarmTheme[] = [
        { seed: "🌱", weed: "🪨" },
        { seed: "🌼", weed: "🌿" },
        { seed: "🥔", weed: "🪱" },
        { seed: "🫛", weed: "🦗" },
        { seed: "🥦", weed: "🦠" },
        { seed: "🍇", weed: "🕷️" },
        { seed: "🌶️", weed: "🔥" },
        { seed: "🌽", weed: "🐛" },
        { seed: "🥬", weed: "🪨" },
        { seed: "🫚", weed: "🪨" },
        { seed: "🌾", weed: "🦟" },
    ];

    public override async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const theme: FarmTheme = Farmer.themes[Globals.random(0, Farmer.themes.length)]!;

        const field: string[] = [];
        const fieldSize = Globals.random(30, 400);

        for (let i = 0; i < fieldSize; i++) {
            const isWeed = Globals.random(1, 100) <= 20; // 20% weeds
            const emoji = isWeed ? theme.weed : theme.seed;
            field.push(emoji || "🚫");
        }

        const original = field.join("");
        const cleaned = field.filter((e) => theme.seed.includes(e)).join("");

        const modal = new AppModal(
            "Weed the Field",
            [
                {
                    name: "Remove all the weeds and rocks!",
                    value: original,
                    style: "Paragraph",
                },
            ],
            async (modal, interaction) => {
                const input = modal.getField(interaction, [...modal.fields.keys()][0]!);

                const user = await AppUser.fromID(interaction.user.id);

                if (input === cleaned) {
                    const reward = cleaned.length / 80;
                    await user.addGold(reward).save();
                    await interaction.reply({
                        content: `${theme.seed} Nice work! You weeded the field\n+${reward.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`,
                        flags: "Ephemeral",
                    });
                } else {
                    await interaction.reply({
                        content: `🚫 The field either still had weeds or you destroyed some of the farmers crops 🌱`,
                        flags: "Ephemeral",
                    });
                }
            },
        );

        return (await interaction.showModal(modal.builder)) as any;
    }
}
