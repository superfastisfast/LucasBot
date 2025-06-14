import { Command } from "@/command";
import { SlashCommandBuilder, type Client, type CommandInteraction } from "discord.js";

export default class DeezNutsCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder().setName("deeznuts").setDescription("ha goteem").toJSON();
    }

    override async executeCommand(client: Client, interaction: CommandInteraction): Promise<void> {
        console.log("deez nuts activated");

        interaction.reply("ha goteem ha.... goteem");
    }
}
