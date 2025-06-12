import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type ButtonInteraction } from 'discord.js';

export class AppButton {
    id: string;
    builder: ButtonBuilder;
    onPress: (interaction: ButtonInteraction) => void;

    static buttons: Map<string, AppButton> = new Map();

    constructor(label: string, onPress: (interaction: ButtonInteraction) => void, style: ButtonStyle = ButtonStyle.Primary) {
        this.onPress = onPress;
        const randomId = Math.random()
        this.id = `#${randomId.toString()}`;

        this.builder = new ButtonBuilder()
            .setCustomId(this.id)
            .setLabel(label)
            .setStyle(style)

        AppButton.buttons.set(this.id, this);
    }

    reset() {
        const randomId = Math.random()
        this.id = `#${randomId.toString()}`;
    }

    static createActionRow(
        buttons: Map<string, AppButton>,
        selected: string[],
    ): ActionRowBuilder<ButtonBuilder> {
        const selectedButtons = selected
            .map(key => buttons.get(key))
            .filter((btn): btn is AppButton => btn !== undefined);

        const components = selectedButtons.map(btn => btn.builder);

        return new ActionRowBuilder<ButtonBuilder>().addComponents(components);
    }

}