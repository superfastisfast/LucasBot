import { Command } from "@/commands";
import { Item } from "@/models/item";
import { AppUser } from "@/user";
import {
    CommandInteraction,
    InteractionResponse,
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    EmbedBuilder,
    ButtonInteraction,
    ButtonStyle,
} from "discord.js";
import { Globals } from "..";
import { AppButton } from "@/ui";

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
                    required: true,
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
        new Command.Command(
            "sell",
            "Sells an item from your inventory",
            [
                {
                    name: "item",
                    description: "The item you want to sell for da monkeeeeyyy",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
            ],
            this.onSell,
            this.onAutocomplete,
        ),
        // new Command.Command(
        //     "trade",
        //     "Trade an item with another businessperson.",
        //     [
        //         {
        //             name: "person",
        //             description: "The user you want to trade with.",
        //             type: ApplicationCommandOptionType.User,
        //             required: true,
        //         },
        //         {
        //             name: "offer",
        //             description: "The item you want to offer.",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //             autocomplete: true,
        //         },
        //         {
        //             name: "request",
        //             description: "The item you want in return.",
        //             type: ApplicationCommandOptionType.String,
        //             required: true,
        //             autocomplete: true,
        //         },
        //         {
        //             name: "offer_amount",
        //             description: "How many of the item (or how much gold) you're offering.",
        //             type: ApplicationCommandOptionType.Number,
        //         },
        //         {
        //             name: "request_amount",
        //             description: "How many of the item (or how much gold) you want in return.",
        //             type: ApplicationCommandOptionType.Number,
        //         },
        //     ],
        //     this.onTrade,
        // ),
    ];

    public async onEquip(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const item = Item.manager.findByName(interaction.options.get("item")?.value as string);
        if (!item) {
            return interaction.reply({
                content: `Item "${interaction.options.get("item")?.value as string}" not found.`,
                flags: "Ephemeral",
            });
        }

        const user = await AppUser.fromID(interaction.user.id);

        let slot: number | null = null;
        let replacement_slot: number | null = null;

        user.inventory.items.forEach(([equipped, name], i) => {
            if (equipped) return; // skip equipped slots

            const newItem = Item.manager.findByName(name);
            if (!newItem) return;

            if (name !== item.name) return;

            slot = i;

            if (newItem.type !== "item") {
                user.inventory.items.forEach(([equipped2, name2], i2) => {
                    if (!equipped2) return;

                    const replacementItem = Item.manager.findByName(name2);
                    if (!replacementItem) return;

                    if (replacementItem.type === newItem.type) {
                        replacement_slot = i2;
                    }
                });
            }
        });

        if (item.type !== "item" && replacement_slot !== null) {
            user.inventory.items[replacement_slot]![0] = false;
        }

        if (slot !== null) {
            user.inventory.items[slot]![0] = true;
            user.inventory.markModified("items");
            await user.save();

            return interaction.reply({
                content: `Equipped ${item.type === "item" ? "item" : item.type} "${item.name}"`,
                flags: "Ephemeral",
            });
        } else {
            return interaction.reply({
                content: `Item "${item.name}" not found in your unequipped inventory.`,
                flags: "Ephemeral",
            });
        }
    }

    public async onUnequip(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const itemNameOpt = interaction.options.get("item")?.value as string;
        const user = await AppUser.fromID(interaction.user.id);

        for (let i = 0; i < user.inventory.items.length; i++) {
            const slot = user.inventory.items[i];
            const item = Item.manager.findByName(slot?.[1] || "");
            if (!slot || (item!.type === "item" && !slot[0])) continue;

            if (slot[1] === itemNameOpt) {
                user.inventory.items[i]![0] = false;
                user.inventory.markModified("items");
                await user.save();
                break;
            }
        }

        return interaction.reply({ content: `Unequipped item ${itemNameOpt}`, flags: "Ephemeral" });
    }

    public async onAdd(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = (interaction.options.get("user") || interaction).user;
        if (!userOpt) return interaction.reply(`Failed to get user option`);
        const itemNameOpt = interaction.options.get("item")?.value as string;
        const user = await AppUser.fromID(userOpt.id);

        const item = Item.manager.findByName(itemNameOpt);
        if (!item) return interaction.reply({ content: `Item '${itemNameOpt}' not found`, flags: "Ephemeral" });

        await user.addItem(item).save();

        return interaction.reply({ content: `Added a ${item.name} to ${user.discord}'s inventory`, flags: "Ephemeral" });
    }

    public async onSell(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const itemNameOpt = interaction.options.get("item")?.value as string;
        const user = await AppUser.fromID(interaction.user.id);

        const itemIndex = user.inventory.items.findIndex((item) => item[1] === itemNameOpt);
        if (itemIndex === -1) {
            return interaction.reply({
                content: `Either the item doesn't exist or you don't have the item: ${itemNameOpt}`,
                flags: "Ephemeral",
            });
        }

        const sellable = user.inventory.items[itemIndex];
        if (!sellable) return interaction.reply({ content: `You don't have the item '${itemNameOpt}'`, flags: "Ephemeral" });

        const item = Item.manager.findByName(sellable[1]);
        if (!item) {
            return interaction.reply({
                content: `Item '${sellable[1]}' not found`,
                flags: "Ephemeral",
            });
        }

        const prize = item.cost * Math.min(0.6 + user.getStat("charisma") * 0.01, 1);

        user.inventory.items.splice(itemIndex, 1);
        await user.addGold(prize).save();

        return interaction.reply({
            content: `Sold item ${item.name} for ${prize.toFixed(2)} ${Globals.ATTRIBUTES.gold.emoji}`,
            flags: "Ephemeral",
        });
    }

    // public async onTrade(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
    //     const offerItemNameOpt = interaction.options.get("offer")?.value as string;
    //     const returnItemNameOpt = interaction.options.get("return")?.value as string;
    //     const offerAmountOpt = interaction.options.get("offerAmount");
    //     const offerAmount: number = offerAmountOpt ? (offerAmountOpt.value as number) : 1;
    //     const returnAmountOpt = interaction.options.get("returnAmount");
    //     const returnAmount: number = returnAmountOpt ? (returnAmountOpt.value as number) : 1;
    //     const offerer = await AppUser.fromID(interaction.options.get("buyer")?.user.id);
    //     const returner = await AppUser.fromID(interaction.user.id);

    //     const embed = new EmbedBuilder()
    //         .setTitle(`Trade ${returner.discord} ${offerer.discord}`)
    //         .setDescription(`${returner.discord} want to buy ${returnAmount}x ${returnItemNameOpt} for x${offerAmount} ${offerItemNameOpt}`);

    //     const accept = new AppButton(
    //         "Accept 🤝",
    //         async (interaction: ButtonInteraction) => {
    //             if (interaction.user.id !== returner.discord.id) {
    //                 interaction.reply({
    //                     content: "Are are not apart of this trade",
    //                     flags: "Ephemeral",
    //                 });
    //             }

    //             offerer.interaction.reply("Accepted");
    //         },
    //         ButtonStyle.Secondary,
    //     );

    //     const actionRow = AppButton.createActionRow([accept]);

    //     return interaction.reply({
    //         embeds: [embed],
    //         components: actionRow,
    //     });
    // }

    public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const sub = (interaction.options as any).getSubcommand();

        const user = await AppUser.fromID(interaction.user.id);

        let filteredItems: [boolean, string][] = [];
        if (sub === "equip") filteredItems = user.inventory.items.filter(([isEquipped]) => !isEquipped);
        else if (sub === "unequip") filteredItems = user.inventory.items.filter(([isEquipped]) => isEquipped);
        else if (sub === "add") filteredItems = Item.manager.getAll().map((item) => [false, item.name] as [boolean, string]);
        else if (sub === "sell") filteredItems = user.inventory.items;
        else filteredItems = user.inventory.items;

        const options = filteredItems.map(([isEquipped, name]) => ({
            name: `${sub === "add" || sub === "sell" ? Globals.ATTRIBUTES.item.emoji : isEquipped ? "✅" : "❌"} ${name}`,
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

        return interaction.reply({ content: `Cleared ${user.discord}'s inventory`, flags: "Ephemeral" });
    }
}
