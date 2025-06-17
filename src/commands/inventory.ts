import { Command } from "@/commands";
import { InventoryDB } from "@/models/inventory";
import { AppUser } from "@/user";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";

export default class QuestCommand extends Command.Base {
    public override main: Command.Command = new Command.Command("inventory", "Inventory related stuff", []);
    public override subs: Command.Command[] = [
        new Command.Command(
            "equip",
            "Equip an item",
            [
                {
                    name: "name",
                    description: "The name of the item you want to equip",
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
                    name: "name",
                    description: "The name of the item you want to unequip",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
            ],
            this.onUnequip,
            this.onAutocomplete,
        ),
    ];

    public async onEquip(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const nameOpt = interaction.options.get("name")?.value as string;
        const user = await AppUser.fromID(interaction.user.id);

        for (let i = 0; i < user.inventory.items.length; i++) {
            const item = user.inventory.items[i];
            if (!item) continue;
            if (item[1] === nameOpt) {
                user.inventory.items[i]![0] = true;
                user.inventory.markModified("items");
                await user.save();
                break;
            }
        }

        return interaction.reply({ content: `Equipped '${nameOpt}'.`, flags: "Ephemeral" });
    }

    public async onUnequip(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const nameOpt = interaction.options.get("name")?.value as string;
        const user = await AppUser.fromID(interaction.user.id);

        for (let i = 0; i < user.inventory.items.length; i++) {
            const item = user.inventory.items[i];
            if (!item) continue;
            if (item[1] === nameOpt) {
                user.inventory.items[i]![0] = false;
                user.inventory.markModified("items");
                await user.save();
                break;
            }
        }

        return interaction.reply({ content: `Unequipped '${nameOpt}'.`, flags: "Ephemeral" });
    }

    public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const sub = (interaction.options as any).getSubcommand();

        const user = await AppUser.fromID(interaction.user.id);

        let filteredItems: Array<[boolean, string]> = [];
        if (sub === "equip") filteredItems = user.inventory.items.filter(([isEquipped]) => !isEquipped);
        else if (sub === "unequip") filteredItems = user.inventory.items.filter(([isEquipped]) => isEquipped);
        else filteredItems = user.inventory.items;

        const options = filteredItems.map(([isEquipped, name]) => ({
            name: `${isEquipped ? "✅" : "❌"} ${name}`,
            value: name,
        }));

        const focusedValue = interaction.options.getFocused();

        const matchedOptions = options.filter((option) => option.name.toLowerCase().includes(focusedValue.toLowerCase()));

        await interaction.respond(matchedOptions.slice(0, 25));
    }
}
