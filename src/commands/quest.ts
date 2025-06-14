import { Command } from "@/command";
import { Quest } from "@/quest";
import {
    AutocompleteInteraction,
    InteractionContextType,
    SlashCommandBuilder,
    type Client,
    type CommandInteraction,
} from "discord.js";

export default class QuestCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("quest")
            .setDescription("Execute a quest")
            .addSubcommand((opt) => 
                opt
                    .setName("execute")
                    .setDescription("Executes a quest")
                    .addStringOption((opt) =>
                        opt
                            .setName("name")
                            .setDescription("The name of the quest you want to execute")
                            .setAutocomplete(true)
                            .setRequired(true),
                    )
            )
            .addSubcommand((opt) => 
                opt
                    .setName("end")
                    .setDescription("Ends a quest")
                    .addStringOption((opt) =>
                        opt
                            .setName("name")
                            .setDescription("The name of the quest you want to execute")
                            .setAutocomplete(true)
                            .setRequired(true),
                    )
            )
            .setDefaultMemberPermissions(0n)
            .setContexts(InteractionContextType.Guild)
            .toJSON();
    }

    override async executeAutoComplete(
        client: Client,
        interaction: AutocompleteInteraction,
    ): Promise<void> {
        const sub = (interaction.options as any).getSubcommand();
        const quests = sub === "execute" ? Quest.quests : Quest.active;

        const options = Array.from(quests.keys()).map(q => ({
            name: q,
            value: q,
        }));

        await interaction.respond(options);
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction,
    ): Promise<void> {
        const sub = (interaction.options as any).getSubcommand();
        const nameOption = interaction.options.get("name", true).value as string;
    
        const quest = Quest.quests.get(nameOption) ;
    
        if (!quest) {
            await interaction.reply({
                content: `Quest '${quest!.name}' not found`,
                flags: 'Ephemeral'
            });
            return;
        }

        const handlers: Record<string, () => void> = {
            execute: async () => {
                await interaction.reply({
                    content: `Executing quest: ${quest.name}`,
                    flags: 'Ephemeral',
                })

                await Quest.start(quest.name)
                return;
            },
            end: async () => {
                await interaction.reply({
                    content: `Ending quest: ${quest.name}`,
                    flags: 'Ephemeral'
                })

                await Quest.end(quest.name)
                return;
            },
        };

        const handler = handlers[sub];
        if (handler)
            handler();
        else
            await interaction.reply(`Invalid sub command ${sub}`);
    }
}
