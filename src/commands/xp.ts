import { Command } from "@/command";
import { SlashCommandBuilder, User, type Client, type CommandInteraction } from "discord.js";
import { giveXP, setXP, UserModel } from "../models/user";

export default class XpCommand extends Command {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("xp")
            .setDescription("XP related stuff")
            .addSubcommand(sub =>
                sub.setName("view")
                .setDescription("View the XP of a user")
                .addUserOption(opt =>
                    opt.setName("target").setDescription("Users XP that gets viewed").setRequired(true)
                )
            )
            .addSubcommand(sub =>
                sub.setName("add")
                .setDescription("Add XP to a user")
                .addUserOption(opt =>
                    opt.setName("target").setDescription("User to give XP to").setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName("amount").setDescription("Amount of XP").setRequired(true)
                )
            )
            .addSubcommand(sub =>
                sub.setName("set")
                .setDescription("Set a users XP to a value")
                .addUserOption(opt =>
                    opt.setName("target").setDescription("User to set XP to").setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName("amount").setDescription("Amount of XP").setRequired(true)
                )
            )
            .toJSON();
    }

    override async executeCommand(client: Client, interaction: CommandInteraction<any>): Promise<void> {
        const sub = interaction.options.getSubcommand();
        const targetOption = interaction.options.get("target", false);
        const target = targetOption?.user ?? interaction.user;

        switch (sub) {
            case "view": {
                const usersModel = await UserModel.find();
                for (const userModel of usersModel) {
                    if (userModel.id == target.id) {
                        interaction.reply(`${target} has ${userModel.xp || "no"} xp`);
                    }
                }
                break;
            }
            case "add": {                
                if (!interaction.memberPermissions?.has('Administrator')) break;

                const amount = interaction.options.get("amount")?.value as number;
                giveXP(target.id, amount);
                interaction.reply(`${interaction.user} added ${amount}xp to ${target}`)

                break;
            }
            case "set": {
                if (!interaction.memberPermissions?.has('Administrator')) break;

                const amount = interaction.options.get("amount")?.value as number;
                setXP(target.id, amount);
                interaction.reply(`${interaction.user} set ${target}'s xp to ${amount}`)

                break;
            }
            default:
                
            interaction.reply("You do not have permission to do this!")
        }
    }
}
