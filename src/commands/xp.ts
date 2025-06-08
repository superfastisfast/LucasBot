import { Command } from "@/command";
import {
    EmbedBuilder,
    InteractionContextType,
    SlashCommandBuilder,
    User,
    type Client,
    type CommandInteraction,
} from "discord.js";
import { DataBase, UserModel } from "../models/user";

export default class XpCommand extends Command.Base {
    override get info(): any {
        const targetDesc = "Users XP that gets viewed";
        const amountDesc = "Amount of XP";

        return new SlashCommandBuilder()
            .setName("xp")
            .setDescription("XP related stuff")
            .addSubcommand((sub) =>
                sub
                    .setName("view")
                    .setDescription("View the XP of a user")
                    .addUserOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription(targetDesc)
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("top")
                    .setDescription("Show 10 people with the most XP")
            )
            .addSubcommand((sub) =>
                sub
                    .setName("add")
                    .setDescription("Add XP to a user")
                    .addUserOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription(targetDesc)
                            .setRequired(true),
                    )
                    .addIntegerOption((opt) =>
                        opt
                            .setName("amount")
                            .setDescription(amountDesc)
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("set")
                    .setDescription("Set a users XP to a value")
                    .addUserOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription(targetDesc)
                            .setRequired(true),
                    )
                    .addIntegerOption((opt) =>
                        opt
                            .setName("amount")
                            .setDescription(amountDesc)
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

        switch (sub) {
            case "view": {
                const usersModel = await UserModel.find();
                for (const userModel of usersModel) {
                    if (userModel.id == target.id) {
                        interaction.reply(
                            `${target} has ${userModel.xp || "no"} XP`,
                        );
                    }
                }
                break;
            }
            case "top": {                
                try {
                    const topUsers = await UserModel.find().sort({ xp: -1 }).limit(10).exec();
                
                    if (topUsers.length === 0) {
                        await interaction.reply("No users found in the leaderboard.");
                        return;
                    }
                                    
                    const lines = await Promise.all(
                        topUsers.map(async (user, index) => {
                            const name = await DataBase.getUser(user.id);
                            return `**${index + 1}.** ${name} — ${user.xp} XP`;
                        })
                    );
                    const description = lines.join("\n");

                
                    const embed = new EmbedBuilder()
                        .setTitle("🏆 XP Leaderboard")
                        .setDescription(description)
                        .setColor(0xFFD700);
                
                    await interaction.reply({ embeds: [embed] });
                
                } catch (err) {
                    console.error("Failed to fetch leaderboard:", err);
                    await interaction.reply("There was an error while fetching the leaderboard.");
                }

                break;
            }
            case "add": {
                if (!interaction.memberPermissions?.has("Administrator")) break;

                const amount = interaction.options.get("amount")
                    ?.value as number;
                try {
                    DataBase.giveXP(target.id, amount);
                    interaction.reply({
                        content: `${interaction.user} added ${amount} XP to ${target}`,
                        flags: "Ephemeral",
                    });
                } catch (err) {
                    console.error(err);
                    interaction.reply({
                        content: `${interaction.user} failed to give ${target} ${amount} XP`,
                        flags: "Ephemeral",
                    });
                }

                break;
            }
            case "set": {
                if (!interaction.memberPermissions?.has("Administrator")) break;

                const amount = interaction.options.get("amount")
                    ?.value as number;
                try {
                    DataBase.setXP(target.id, amount);
                    interaction.reply({
                        content: `${interaction.user} set ${target}'s XP to ${amount}`,
                        flags: "Ephemeral",
                    });
                } catch (err) {
                    console.error(err);
                    interaction.reply({
                        content: `${interaction.user} failed to set ${target}'s XP to ${amount}`,
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
