import { Command } from "@/command";
import {
    SlashCommandBuilder,
    User,
    InteractionContextType,
    type Client,
    type CommandInteraction,
} from "discord.js";

export default class XpCommand extends Command.Base {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("role")
            .setDescription("Role related stuff")
            .addSubcommand((sub) =>
                sub
                    .setName("give")
                    .setDescription("Gives a role to a user")
                    .addUserOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription("User to give role to")
                            .setRequired(true),
                    )
                    .addRoleOption((opt) =>
                        opt
                            .setName("role")
                            .setDescription("The role you want to be given")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("remove")
                    .setDescription("Remove a role of a user")
                    .addUserOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription("User to remove role frome")
                            .setRequired(true),
                    )
                    .addRoleOption((opt) =>
                        opt
                            .setName("role")
                            .setDescription("The role you want to be removed")
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
        const target =
            interaction.options.get("target")?.user || interaction.user;
        const role = interaction.options.get("role")?.role || "everyone";

        const member = await interaction.guild.members.fetch(target.id);

        if (!role || !member) {
            interaction.reply({
                content: "Invalid user or role.",
                ephemeral: true,
            });
        }

        switch (sub) {
            case "give": {
                if (
                    !interaction.memberPermissions?.has("Administrator") &&
                    !interaction.member.roles.cache.has("1379498052431384687")
                )
                    break;

                try {
                    member.roles.add(role);
                    interaction.reply({
                        content: `${interaction.user} gave role ${role.toString()} to ${target}`,
                        flags: "Ephemeral",
                    });
                } catch (err) {
                    console.error(err);
                    interaction.reply({
                        content: `${interaction.user} failed to add role ${role.toString()} from user ${target}`,
                        flags: "Ephemeral",
                    });
                }

                break;
            }
            case "remove": {
                if (!interaction.memberPermissions?.has("Administrator")) break;

                try {
                    member.roles.remove(role);
                    interaction.reply({
                        content: `${interaction.user} removed role ${role.toString()} from ${target}`,
                        flags: "Ephemeral",
                    });
                } catch (err) {
                    console.error(err);
                    interaction.reply({
                        content: `${interaction.user} failed to remove role ${role.toString()} from user ${target}`,
                        flags: "Ephemeral",
                    });
                }

                break;
            }
            default:
                interaction.reply("You do not have permission to do this!");
        }
    }
}
