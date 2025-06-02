// import { Command } from "@/command";
// import {
//     SlashCommandBuilder,
//     AutocompleteInteraction,
//     type Client,
//     type CommandInteraction,
// } from "discord.js";

// export default class XpCommand extends Command {
//     override get info(): any {
//         return new SlashCommandBuilder()
//             .setName("xp")
//             .setDescription("Everything to do with XP!")
//             .addUserOption((option) => 
//                 option.setName("user").setDescription("User")
//             )
//             // .addStringOption((option) =>
//             //     option.setName("option").setDescription("Option").setAutocomplete(true).setRequired(true),
//             // )
//             .toJSON();
//     }


//     // override async executeAutoComplete(client: Client, interaction: AutocompleteInteraction): Promise<void> {
// 	// 	const focusedOption = interaction.options.getFocused();
// 	// 	const choices = ['Popular Topics: Threads', 'Sharding: Getting started', 'Library: Voice Connections', 'Interactions: Replying to slash commands', 'Popular Topics: Embed preview'];
// 	// 	const filtered = choices.filter(choice => choice.startsWith(focusedOption));
// 	// 	await interaction.respond(
// 	// 		filtered.map(choice => ({ name: choice, value: choice })),
// 	// 	);
//     // }

//     override async executeCommand(client: Client, interaction: CommandInteraction<any>): Promise<void> {
//         let member = interaction.options.get("user")?.member;
//         // let option = interaction.options.get("option")?.value;

//         console.log(member);

//         interaction.reply("Pong Works! " + member?.nickname || "nope");
//     }
// }

import { Command } from "@/command";
import { SlashCommandBuilder, User, type Client, type CommandInteraction } from "discord.js";
import mongoose from "mongoose";
import { UserModel } from '../models/user';

export default class XpCommand extends Command {
    override get info(): any {
        return new SlashCommandBuilder()
            .setName("xp")
            .setDescription("XP related stuff")
            .addUserOption((option) => 
                option.setName("user")
                .setDescription("User")
                .setRequired(false)
            )
            .toJSON();
    }

    override async executeCommand(client: Client, interaction: CommandInteraction<any>): Promise<void> {
        const userOption = interaction.options.get("user", false);
        const user = userOption?.user ?? interaction.user;

        let xp: number | undefined;

        const usersModel = await UserModel.find();
        for (const userModel of usersModel) {
            if (userModel.id == user.id) {
                xp = userModel.xp;
                break;
            }
        }

        interaction.reply(`${user.username} has ${xp || "no"} xp`);
    }
}
