import { Command } from "@/command";
import {
    AutocompleteInteraction,
    InteractionContextType,
    SlashCommandBuilder,
    type Client,
    type CommandInteraction,
} from "discord.js";

export default class ModGiveRole extends Command {
    override get info(): any {
        console.log("info called");
        return new SlashCommandBuilder()
            .setName("giverole")
            .setDescription("give a role to au ser")
            .addUserOption((option) =>
                option
                    .setName("role_reciver")
                    .setDescription("user to recive role")
                    .setRequired(true),
            )
            .addRoleOption((option) =>
                option
                    .setName("role")
                    .setDescription("role to recive")
                    .setRequired(true),
            )
            .setDefaultMemberPermissions(0n)
            .setContexts(InteractionContextType.Guild)
            .toJSON();
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        interaction.reply("Ping Works!");
    }
}
