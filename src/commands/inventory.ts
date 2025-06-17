import { Command } from "@/commands";
import { Item } from "@/models/item";
import { AppUser } from "@/user";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";
import { Globals } from "..";

export default class QuestCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("inventory", "Inventory related stuff", []);
    public override subs: Command.Command[] = [
        new Command.Command(
            "equip",
            "Equip an item",
            [
                {
                    name: "item",
                    description: "The item you want to equip",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    autocomplete: true,
                },
            ],
            this.onEquip,
            this.onAutocomplete,
        ),
        new Command.Command(
            "unequip",
            "Unequip an item",
            [
                {
                    name: "item",
                    description: "The item you want to unequip",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
            ],
            this.onUnequip,
            this.onAutocomplete,
        ),
        new Command.Command(
            "add",
            "Adds an item to a users inventory",
            [
                {
                    name: "user",
                    description: "The user that you want to be poor",
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: "item",
                    description: "The item you want to give to the user",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
            ],
            this.onAdd,
            this.onAutocomplete,
            true,
        ),
        new Command.Command(
            "clear",
            "Clears an inventory",
            [
                {
                    name: "user",
                    description: "The user that you want to be poor",
                    type: ApplicationCommandOptionType.User,
                },
            ],
            this.onClear,
            undefined,
            true,
        ),
    ];

    public async onEquip(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const itemNameOpt = interaction.options.get("item")?.value as string;
        const user = await AppUser.fromID(interaction.user.id);

        for (let i = 0; i < user.inventory.items.length; i++) {
            const item = user.inventory.items[i];
            if (!item) continue;
            if (item[1] === itemNameOpt) {
                user.inventory.items[i]![0] = true;
                user.inventory.markModified("items");
                await user.save();
                break;
            }
        }

        return interaction.reply({ content: `Equipped '${itemNameOpt}'.`, flags: "Ephemeral" });
    }

    public async onUnequip(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const itemNameOpt = interaction.options.get("item")?.value as string;
        const user = await AppUser.fromID(interaction.user.id);

        for (let i = 0; i < user.inventory.items.length; i++) {
            const item = user.inventory.items[i];
            if (!item) continue;
            if (item[1] === itemNameOpt) {
                user.inventory.items[i]![0] = false;
                user.inventory.markModified("items");
                await user.save();
                break;
            }
        }

        return interaction.reply({ content: `Unequipped '${itemNameOpt}'.`, flags: "Ephemeral" });
    }

    public async onAdd(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = (interaction.options.get("user") || interaction).user;
        if (!userOpt) return interaction.reply(`Failed to get user option`);
        const itemNameOpt = interaction.options.get("item")?.value as string;
        const user = await AppUser.fromID(userOpt.id);

        const item = Item.manager.findByName(itemNameOpt);
        if (!item) return interaction.reply({ content: `Item '${itemNameOpt}' not found`, flags: "Ephemeral" });

        await user.addItem(item).save();

        return interaction.reply({ content: `Cleared '${user.discord}'`, flags: "Ephemeral" });
    }

    public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const sub = (interaction.options as any).getSubcommand();

        const user = await AppUser.fromID(interaction.user.id);

        let filteredItems: Array<[boolean, string]> = [];
        if (sub === "equip") filteredItems = user.inventory.items.filter(([isEquipped]) => !isEquipped);
        else if (sub === "unequip") filteredItems = user.inventory.items.filter(([isEquipped]) => isEquipped);
        else if (sub === "add") filteredItems = Item.manager.getAll().map((item) => [false, item.name] as [boolean, string]);
        else filteredItems = user.inventory.items;

        const options = filteredItems.map(([isEquipped, name]) => ({
            name: `${sub === "add" ? Globals.ATTRIBUTES.items.emoji : isEquipped ? "✅" : "❌"} ${name}`,
            value: name,
        }));

        const focusedValue = interaction.options.getFocused();

        const matchedOptions = options.filter((option) => option.name.toLowerCase().includes(focusedValue.toLowerCase()));

        await interaction.respond(matchedOptions.slice(0, 25));
    }

    public async onClear(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = (interaction.options.get("user") || interaction).user;
        if (!userOpt) return interaction.reply(`Failed to get user option`);
        const user = await AppUser.fromID(userOpt.id);

        user.inventory.items = [];
        await user.save();

        return interaction.reply({ content: `Cleared '${user.discord}'`, flags: "Ephemeral" });
    }
}
