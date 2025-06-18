import { Command } from "@/commands";
import { Quest } from "@/quest";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";

export default class QuestCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("quest", "Quest related stuff", []);
    public override subs: Command.Command[] = [
        new Command.Command(
            "execute",
            "Executes a quest",
            [
                {
                    name: "name",
                    description: "The name of the quest you want to execute",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    autocomplete: true,
                },
            ],
            this.onExecute,
            this.onAutocomplete,
            true,
        ),
        new Command.Command(
            "end",
            "Ends a quest",
            [
                {
                    name: "name",
                    description: "The name of the quest you want to end",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
            ],
            this.onEnd,
            this.onAutocomplete,
            true,
        ),
    ];

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const questKeys = [...Quest.quests.keys()];
        const random: string | undefined = questKeys[Math.floor(Math.random() * questKeys.length)];
        const nameOpt: string | undefined = (interaction.options.get("name", false)?.value as string) || random;

        Quest.start(nameOpt!);
        return interaction.reply({ content: `Executing quest '${nameOpt}'`, flags: "Ephemeral" });
    }

    public async onEnd(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const nameOpt: string = interaction.options.get("name")?.value as string;

        Quest.end(nameOpt);

        return interaction.reply({ content: `Ending quest '${nameOpt}'`, flags: "Ephemeral" });
    }

    public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focused = interaction.options.getFocused();
        const sub = (interaction.options as any).getSubcommand();
        const quests = sub === "execute" ? Quest.quests : Quest.active;

        const options = Array.from(quests.keys())
            .filter((q) => q.toLowerCase().includes(focused.toLowerCase()))
            .slice(0, 25)
            .map((q) => ({
                name: q,
                value: q,
            }));

        await interaction.respond(options);
    }
}
