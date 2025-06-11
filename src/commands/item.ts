import { Command } from "@/command";
import {
    InteractionContextType,
    SlashCommandBuilder,
    type Client,
    type CommandInteraction,
} from "discord.js";
import { ItemModel } from '../models/item';



export default class ItemCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("item")
            .setDescription("Item related stuff")
            .addSubcommand((sub) =>
                sub
                    .setName("add")
                    .setDescription("Add the item")
                    .addStringOption((opt) =>
                        opt
                            .setName("name")
                            .setDescription("User to give gold to")
                            .setRequired(true),
                    )
                    .addStringOption(opt =>
                      opt
                        .setName("tag")
                        .setDescription("The tag")
                        .setRequired(true)
                        .addChoices(
                            { name: "Weapon", value: "weapon" },
                            { name: "Helmet", value: "helmet" },
                            { name: "Chestplate", value: "chestplate" },
                            { name: "Leggings", value: "leggings" },
                            { name: "Boots", value: "boots" },
                            { name: "Shield", value: "shield" },
                        ),
                    )
                    .addIntegerOption(opt =>
                        opt
                            .setName("cost")
                            .setDescription("The item cost"),
                    )
                    .addStringOption(opt =>
                        opt
                            .setName("attributes")
                            .setDescription("Attributes"),
                    )
            )
            .setDefaultMemberPermissions(0n)
            .setContexts(InteractionContextType.Guild)
            .toJSON();
    }

    override async executeCommand(
        client: Client,
        interaction: CommandInteraction<any>,
    ): Promise<void> {
        const sub = interaction.options.getSubcommand();

        switch (sub) {
            case "add": {
                const nameOption = interaction.options.get("name")?.value as string;
                const tagOption = interaction.options.get("name")?.value as string;
                const costOption = interaction.options.get("cost")?.value as number;
                const attributesOption = interaction.options.get("attributes")?.value as string;

                const attributes = ItemCommand.parseAttributes(new String(attributesOption));

                const newItem = await ItemModel.create({
                    name: nameOption,
                    tag: tagOption,
                    cost: costOption,
                    flatStatModifiers: attributes.flatStatModifiers,
                    percentageStatModifiers: attributes.percentageStatModifiers,
                });

                newItem.save();

                interaction.reply({
                    content: `${interaction.user} added item name: '${nameOption}', tag: '${tagOption}', cost: ${costOption} gold, attr: '${attributesOption}'`,
                    flags: "Ephemeral",
                });

                break;
            }
            default:
                interaction.reply({
                    content: "You do not have permission to do this!",
                    flags: "Ephemeral",
                });
        }
    }

    static parseAttributes(attributes: String) {
        let flatStatModifiers = new Map<string, number>();
        let percentageStatModifiers = new Map<string, number>();

        const modifiers = attributes.split(",");

        for (const modifier of modifiers) {
            const parts = modifier.split("=");
        
            const key = parts[0]?.trim();
            const rawValue = parts[1]?.trim() ?? "0";
            const value = Number(rawValue.slice(0, rawValue.length - 1));
        
            if (!key) continue; // skip empty keys
            if (isNaN(value)) continue; // skip invalid numbers
        
            if (rawValue.endsWith("%")) {
                percentageStatModifiers.set(key, value);
            } else {
                flatStatModifiers.set(key, value);
            }
        }


        return {
            flatStatModifiers: flatStatModifiers,
            percentageStatModifiers: percentageStatModifiers,
        }
    }
}