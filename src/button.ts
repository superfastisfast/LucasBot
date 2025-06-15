import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type ButtonInteraction } from "discord.js";

export class AppButton {
    id: string;
    builder: ButtonBuilder;
    onPress: (interaction: ButtonInteraction) => void;

    static buttons: Map<string, AppButton> = new Map();

    constructor(
        label: string,
        onPress: (interaction: ButtonInteraction) => void,
        style: ButtonStyle = ButtonStyle.Primary,
    ) {
        this.onPress = onPress;
        const randomId = Math.random();
        this.id = `#${randomId.toString()}`;

        this.builder = new ButtonBuilder().setCustomId(this.id).setLabel(label).setStyle(style);

        AppButton.buttons.set(this.id, this);
    }

    static createActionRow(buttons: Map<string, AppButton>, selected: string[]): ActionRowBuilder<ButtonBuilder>[] {
        const selectedButtons = selected
            .map((key) => buttons.get(key))
            .filter((btn): btn is AppButton => btn !== undefined);

        if (selectedButtons.length === 0) {
            throw new Error(`You must select between 1 and 25 buttons. Got: ${selectedButtons.length}`);
        }

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        for (let i = 0; i < selectedButtons.length; i += 5) {
            const chunk = selectedButtons.slice(i, i + 5);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...chunk.map((btn) => btn.builder));
            rows.push(row);
        }

        return rows;
    }
}
