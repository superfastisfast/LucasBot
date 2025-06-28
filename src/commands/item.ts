import { Command } from "@/commands";
import { Item } from "@/models/item";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, AutocompleteInteraction, User, EmbedBuilder } from "discord.js";
import { Globals } from "..";
import { UserDB } from "@/models/user";

export default class ItemCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("item", "Item related stuff", []);
    public override subs: Command.Command[] = [
        new Command.Command(
            "view",
            "Shows an items stats",
            [
                {
                    name: "name",
                    description: "The name of the item you want to view",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
            ],
            this.onView,
            this.onViewAutocomplete,
        ),
        // new Command.Command(
        //     "add",
        //     "Add an item",
        //     [
        //         {
        //             name: "name",
        //             description: "The name of the new item",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //         },
        //         {
        //             name: "type",
        //             description: "The item type",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //             autocomplete: true,
        //         },
        //         {
        //             name: "cost",
        //             description: "How much the item costs",
        //             type: ApplicationCommandOptionType.Number,
        //             required: true,
        //         },
        //         {
        //             name: "modifiers",
        //             description: "The items modifiers",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //             autocomplete: true,
        //         },
        //     ],
        //     this.onAdd,
        //     this.onAddAutocomplete,
        //     true,
        // ),
        // new Command.Command(
        //     "remove",
        //     "Remove an item",
        //     [
        //         {
        //             name: "name",
        //             description: "The name of the item you want to remove",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //             autocomplete: true,
        //         },
        //     ],
        //     this.onRemove,
        //     this.onRemoveAutocomplete,
        //     true,
        // ),
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
                image_url: "",
            })
            .save();

        return interaction.reply({
            content: `Created item\nName: '${nameOpt}'\nCost: ${costOpt} ${Globals.ATTRIBUTES.gold.emoji}\nType: '${typeOpt}'\nModifiers:\n'${modifiersOpt}'`,
            flags: "Ephemeral",
        });
    }

    public async onRemove(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const nameOpt = interaction.options.get("name")?.value as string;

        const deleted = Item.manager.delete(nameOpt);
        if (deleted) Item.manager.save();
        return interaction.reply({
            content: deleted ? `Removed item '${nameOpt}'` : `Failed to delete item: ${nameOpt}`,
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

    public async onView(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const nameOpt = interaction.options.get("name")?.value as string;

        const item = Item.manager.findByName(nameOpt);
        if (!item)
            return interaction.reply({
                content: `Failed to find item: ${nameOpt}`,
                flags: "Ephemeral",
            });

        let modifers: string = "";
        Object.entries(item.flatModifiers ?? {}).forEach(([key, value]) => {
            if (value !== 0) modifers += `${Globals.ATTRIBUTES[key as keyof typeof Globals.ATTRIBUTES].emoji} ${value > 0 ? "+" : ""}${value}, `;
        });
        Object.entries(item.percentageModifiers ?? {}).forEach(([key, value]) => {
            if (value !== 0)
                modifers += `${Globals.ATTRIBUTES[key as keyof typeof Globals.ATTRIBUTES].emoji} ${value > 0 ? "+" : ""}${value * 100}%, `;
        });

        const embed = new EmbedBuilder()
            .setTitle(`${item.name} ${Globals.ATTRIBUTES.item.emoji}`)
            .setDescription(`Worth: ${item.cost} ${Globals.ATTRIBUTES.gold.emoji}\nType: ${item.type}\n\n${modifers}`)
            .setColor("#CD9F61")
            .setThumbnail(item.image_url)
            .setFooter({ text: `Item View of ${item.name}` })
            .setTimestamp();
        return interaction.reply({
            embeds: [embed],
            flags: "Ephemeral",
        });
    }

    public async onViewAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const filteredItems: Array<[boolean, string]> = Item.manager.getAll().map((item) => [false, item.name] as [boolean, string]);

        const options = filteredItems.map(([isEquipped, name]) => ({
            name: `${Globals.ATTRIBUTES.item.emoji} ${name}`,
            value: name,
        }));

        const focusedValue = interaction.options.getFocused();

        const matchedOptions = options.filter((option) => option.name.toLowerCase().includes(focusedValue.toLowerCase()));

        await interaction.respond(matchedOptions.slice(0, 25));
    }

    static parseModifiers(modifiers: string): any {
        const flatModifiers = new Map<string, number>();
        const percentageModifiers = new Map<string, number>();

        for (const modifier of modifiers.split(",")) {
            const parts = modifier.split("=");
            const key = parts[0]?.trim();
            const rawValue = parts[1]?.trim() ?? "0";

            if (!key) continue;

            const isPercentage = rawValue.endsWith("%");

            const numericPart = isPercentage ? rawValue.slice(0, -1) : rawValue;

            const value = parseFloat(numericPart);

            if (isNaN(value)) continue;

            (isPercentage ? percentageModifiers : flatModifiers).set(key, value);
        }

        return {
            flatModifiers: Object.fromEntries(flatModifiers),
            percentageModifiers: Object.fromEntries(percentageModifiers),
        };
    }
}
