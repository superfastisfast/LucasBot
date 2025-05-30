import { Command } from "@/command";
import { SlashCommandBuilder, User, type Client, type CommandInteraction } from "discord.js";

export default class PongCommand extends Command {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("pong")
            .setDescription("test")
            .addUserOption((option) => option.setName("user").setDescription("The user to pong"))
            .toJSON();
    }

    override async executeCommand(client: Client, interaction: CommandInteraction<any>): Promise<void> {
        let member = interaction.options.get("user")?.member;

        console.log(member);

        interaction.reply("Pong Works! " + member?.nickname || "nope");
    }
}
