import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, EmbedBuilder } from "discord.js";
import { Globals } from "..";

export default class HelpCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("help", "See what you can do with this bot", [], this.onExecute.bind(this));

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        // prettier-ignore
        const description: string = 
`**Commands**\n
/globglogabgelab - Gets a random globglogabgelab remix\n
/work - Earn money by doing random work <-- Currently depricated\n
/donate -Donate money to a poor person\n
/fight - Fight against a player for money\n
/inventory (equip, unequip) - \n
/item (view) - Shows an items modifiers\n
/shop - Buy an item\n
/profile - Show someones profile with stat and inventory info\n
/xp (top) - Shows the xp leaderboard\n

**Quests**\n
Random quests and happen sometimes, join to earn money but some have risks.
`;

        const embed = new EmbedBuilder().setTitle("Help Manual").setColor("Grey").setURL(Globals.LINK).setDescription(description);

        return await interaction.reply({
            embeds: [embed],
            flags: "Ephemeral",
        });
    }
}
