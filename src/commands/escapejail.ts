import { Command } from "@/command";
import { SlashCommandBuilder, type Client, type CommandInteraction } from "discord.js";

export default class EscapeJailCommand extends Command {
    override get info(): any {
        console.log("escapejail called");
        return new SlashCommandBuilder()
            .setName("escapejail")
            .setDescription("Try to escape from jail")
            .addStringOption(opt => 
                opt.setName("choice")
                    .setDescription("Choose what to do")
                    .setRequired(true)
                    .addChoices (
                        { name: "Use Charisma To Escape (High risk to fail)", value: "use_charisma"},
                        { name: "Pay bail", value: "pay_bail"}
                    )
            )
            .toJSON();
    }

    override async executeCommand(client: Client, interaction: CommandInteraction): Promise<void> {
        const action = interaction.options.getString("choice");

        switch (action) {
            case "use_charisma":
                // handle the user using charisma
                interaction.reply("You failed to escape... the bail becomes bigger.")
                break;
            case "pay_bail":
                // handle pay bail
                interaction.reply("You pay the bail and you are freed or were you *vsauce music plays*")
                break;
            default:
                // handle unknown option
                interaction.reply({ content: "Invalid option", ephemeral: true})
                break;
        }
    }
}