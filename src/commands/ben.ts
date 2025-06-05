import { Command } from "@/command";
import { SlashCommandBuilder, type Client, type CommandInteraction, type RestOrArray } from "discord.js";

export default class BenCommand extends Command {
    override get info(): any {
        console.log("info called");
        return new SlashCommandBuilder()
            .setName("ben")
            .setDescription("Make Ben respond to the haters")
            .addStringOption(option => 
                option.setName("option")
                .setDescription("The thing you want Ben to say to the haters")
                .setRequired(true)
                .setChoices(
                    { name: "Yes", value: "yes" },
                    { name: "No", value: "no" },
                    { name: "Huhuhu", value: "huhuhu" }
                )
            )
            .toJSON();
    }

    override async executeCommand(client: Client, interaction: CommandInteraction): Promise<void> {
        const option = interaction.options.get("option")?.value as string;
        //                                           Yes                                NO          Huhuhu/Beans
        const video: string = option === "Yes" ? "WGYOpG8KglY" : option === "No" ? "FRj_hAO1Sgs" : "lgI93MzC3ZU";

        interaction.reply(`https://www.youtube.com/watch?v=${video}`);
    }
}
