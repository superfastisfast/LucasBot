import { Command } from "@/command";
import {
    InteractionContextType,
    SlashCommandBuilder,
    User,
    type Client,
    type CommandInteraction,
} from "discord.js";
import { AppUser } from "@/user";

export default class GoldCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("gold")
            .setDescription("Gold related stuff")
            .addSubcommand((sub) =>
                sub
                    .setName("view")
                    .setDescription("View how much gold a user has")
                    .addUserOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription("Users gold that gets viewed")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("add")
                    .setDescription("Add gold to a user")
                    .addUserOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription("User to give gold to")
                            .setRequired(true),
                    )
                    .addIntegerOption((opt) =>
                        opt
                            .setName("amount")
                            .setDescription("Amount of gold")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("set")
                    .setDescription("Set a users gold to a value")
                    .addUserOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription("User to set gold to")
                            .setRequired(true),
                    )
                    .addIntegerOption((opt) =>
                        opt
                            .setName("amount")
                            .setDescription("Amount of gold")
                            .setRequired(true),
                    ),
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
        const target = await AppUser.createFromID(
            (interaction.options.get("target")?.user || interaction.user).id,
        );

        switch (sub) {
            case "view": {
                interaction.reply(
                    `${target.discord} has ${target.database.inventory.gold || "no"} gold`,
                );
                break;
            }
            case "add": {
                if (!interaction.memberPermissions?.has("Administrator")) break;

                const amount = interaction.options.get("amount")
                    ?.value as number;

                target.addGold(amount);
                interaction.reply({
                    content: `${interaction.user} added ${amount} gold to ${target.discord}, new total is ${target.database.inventory.gold}`,
                    flags: "Ephemeral",
                });

                break;
            }
            case "set": {
                if (!interaction.memberPermissions?.has("Administrator")) break;

                const amount = interaction.options.get("amount")
                    ?.value as number;

                target.setGold(amount);
                interaction.reply({
                    content: `${interaction.user} set ${target.discord}'s gold to ${amount}`,
                    flags: "Ephemeral",
                });

                break;
            }
            default:
                interaction.reply("You do not have permission to do this!");
        }
    }
}
