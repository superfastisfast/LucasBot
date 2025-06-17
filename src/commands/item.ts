import { Command } from "@/commands";
import { Item } from "@/models/item";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, AutocompleteInteraction, User } from "discord.js";
import { Globals } from "..";
import { UserDB } from "@/models/user";

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
                name: "type",
                description: "The item type",
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
        const typeOpt = interaction.options.get("type")?.value as string;
        const costOpt = interaction.options.get("cost")?.value as number;
        const modifiersOpt = interaction.options.get("modifiers")?.value as string;

        const modifiers = ItemCommand.parseModifiers(modifiersOpt);

        Item.manager
            .create({
                name: nameOpt,
                type: typeOpt,
                cost: costOpt,
                flatModifiers: modifiers.flatModifiers,
                percentageModifiers: modifiers.percentageModifiers,
            })
            .save();

        return interaction.reply({
            content: `Added item name: '${nameOpt}', type: '${typeOpt}', cost: ${costOpt} ${Globals.ATTRIBUTES.gold.emoji}, modifiers: '${modifiersOpt}'`,
            flags: "Ephemeral",
        });
    }

    public async onRemove(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const nameOpt = interaction.options.get("name")?.value as string;

        const item = Item.manager.delete(nameOpt);
        return interaction.reply({
            content: `Removed item '${nameOpt}'`,
            flags: "Ephemeral",
        });
    }

    public async onAddAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const focused = interaction.options.getFocused(true);

        if (focused.name === "type") {
            let types: { name: string; value: string }[] = [];

            Item.Types.forEach((type) => {
                types.push({ name: type, value: type });
            });

            return interaction.respond(types);
        }

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

        let possibleStats = UserDB.StatDB.keyArray;

        for (const part of parts) {
            const cleanedPart = (part.split("=")[0] || "").replace(/[^a-z]/gi, "").toLowerCase();
            possibleStats = possibleStats.filter((stat) => stat.toLowerCase() !== cleanedPart);
        }

        const [keyPart, valuePart] = rawLast.split("=");

        const filteredStats = possibleStats.filter((stat) => stat.toLowerCase().startsWith((keyPart ?? "").toLowerCase()));

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

        const matchingThings = Item.manager
            .find({})
            .filter((item) => {
                $regex: new RegExp(focused.toString(), "i");
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, 25);

        const suggestions = matchingThings.map((item) => ({
            name: item.name,
            value: item.name,
        }));

        await interaction.respond(suggestions.slice(0, 25));
    }

    static parseModifiers(modifiers: string): any {
        const flatModifiers = new Map<string, number>();
        const percentageModifiers = new Map<string, number>();

        for (const modifier of modifiers.split(",")) {
            const parts = modifier.split("=");
            const key = parts[0]?.trim();
            const rawValue = parts[1]?.trim() ?? "0";
            const value = Number(rawValue.slice(0, rawValue.length - 1));

            if (!key) continue;
            if (isNaN(value)) continue;

            (rawValue.endsWith("%") ? percentageModifiers : flatModifiers).set(key, value);
        }

        return {
            flatModifiers: Object.fromEntries(flatModifiers),
            percentageModifiers: Object.fromEntries(percentageModifiers),
        };
    }
}
