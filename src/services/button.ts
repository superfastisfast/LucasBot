import { AppButton } from "@/button";
import { Service } from "@/service";
import { Client, Events, type Interaction } from "discord.js";

export default class ButtonService extends Service.Base {
    override async start(client: Client): Promise<void> {
        client.on(Events.InteractionCreate, this.handleButton);
    }

    override async stop(client: Client): Promise<void> {
        client.off(Events.InteractionCreate, this.handleButton);
    }

    private handleButton = async (interaction: Interaction) => {
        if (!interaction.isButton()) return;
        const button = AppButton.buttons.get(interaction.customId);
        if (button) button.onPress(interaction);
        else interaction.reply({ content: "This button is not active", flags: "Ephemeral" });
        console.log(`${new Date().toISOString()} ${interaction.user.displayName} pressed ${(button!.builder.data as any).label}}`);
    };
}
