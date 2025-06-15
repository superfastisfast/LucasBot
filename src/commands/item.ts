import { Command } from "@/commands";
import { ItemModel } from "@/models/item";
import { Quest } from "@/quest";
import {
    CommandInteraction,
    InteractionResponse,
    ApplicationCommandOptionType,
    AutocompleteInteraction,
} from "discord.js";

export default class ItemCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("item", "Item related stuff", []);
    public override subs: Command.Command[] = [
        // prettier-ignore
        new Command.Command(
            "add",
            "Add an item",
            [{
                name: "name",
                description: "The name of the new item",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "tag",
                description: "The item tag",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
            },
            {
                name: "cost",
                description: "How much the item costs",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
            {
                name: "modifiers",
                description: "The items modifiers",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
            }],
            this.onAdd,
            this.onAddAutocomplete,
        ),
        // prettier-ignore
        new Command.Command(
            "remove",
            "Remove an item",
            [{
                name: "name",
                description: "The name of the item you want to remove",
                type: ApplicationCommandOptionType.String,
                required: true,
                autocomplete: true,
            }],
            this.onRemove,
            this.onRemoveAutocomplete,
        ),
    ];

    public async onAdd(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const nameOpt = interaction.options.get("name")?.value as string;
        const tagOpt = interaction.options.get("tag")?.value as string;
        const costOpt = interaction.options.get("cost")?.value as number;
        const attributesOpt = interaction.options.get("attributes")?.value as string;

        const attributes = ItemCommand.parseAttributes(new String(attributesOpt));

        const newItem = await ItemModel.create({
            name: nameOpt,
            tag: tagOpt,
            cost: costOpt,
            flatStatModifiers: attributes.flatStatModifiers,
            percentageStatModifiers: attributes.percentageStatModifiers,
        });

        newItem.save();

        return interaction.reply({
            content: `Added item name: '${nameOpt}', tag: '${tagOpt}', cost: ${costOpt} gold, attr: '${attributesOpt}'`,
            flags: "Ephemeral",
        });
    }

    public async onRemove(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const nameOpt = interaction.options.get("name")?.value as string;

        await ItemModel.findOneAndDelete({ name: nameOpt });
        return interaction.reply({
            content: `Removed item '${nameOpt}'`,
            flags: "Ephemeral",
        });
    }

    public async onAddAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focused = interaction.options.getFocused(true);

        if (focused.name === "tag")
            return interaction.respond([
                { name: "weapon", value: "weapon" },
                { name: "helmet", value: "helmet" },
                { name: "chestplate", value: "chestplate" },
                { name: "leggings", value: "leggings" },
                { name: "boots", value: "boots" },
                { name: "shield", value: "shield" },
            ]);

        const parts = focused.value
            .toString()
            .split(",")
            .map((p) => p.trim());

        const rawLast = parts.pop() ?? "";

        // Checks if its a number
        if (/\d$/.test(rawLast)) {
            const prefix = parts.length > 0 ? parts.join(", ") + ", " : "";
            const suggestionBase = prefix + rawLast;

            const suggestions = [
                {
                    name: suggestionBase + ",",
                    value: suggestionBase + ",",
                },
                {
                    name: suggestionBase + "%,",
                    value: suggestionBase + "%,",
                },
            ];

            await interaction.respond(suggestions);
            return;
        }

        let possibleStats = ["strength", "agility", "charisma", "magicka", "stamina", "defense", "vitality"];

        for (const part of parts) {
            const cleanedPart = (part.split("=")[0] || "").replace(/[^a-z]/gi, "").toLowerCase();
            possibleStats = possibleStats.filter((stat) => stat.toLowerCase() !== cleanedPart);
        }

        const [keyPart, valuePart] = rawLast.split("=");

        const filteredStats = possibleStats.filter((stat) =>
            stat.toLowerCase().startsWith((keyPart ?? "").toLowerCase()),
        );

        const suggestions = filteredStats.map((stat) => {
            const newInput = parts.length > 0 ? parts.join(", ") + ", " + stat + "=" : stat + "=";

            return {
                name: newInput,
                value: newInput,
            };
        });

        if (focused.value.toString().trim() === "") {
            const allStats = possibleStats.map((stat) => ({
                name: stat + "=",
                value: stat + "=",
            }));
            return await interaction.respond(allStats.slice(0, 25));
        }

        return await interaction.respond(suggestions.slice(0, 25));
    }

    public async onRemoveAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focused = interaction.options.getFocused().toString();

        const matchingThings = await ItemModel.find({
            name: { $regex: new RegExp(focused.toString(), "i") },
        })
            .sort({ name: 1 })
            .limit(25);

        const suggestions = matchingThings.map((item) => ({
            name: item.name,
            value: item.name,
        }));

        await interaction.respond(suggestions.slice(0, 25));
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
        };
    }
}
