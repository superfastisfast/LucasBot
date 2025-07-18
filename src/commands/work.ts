import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, AutocompleteInteraction, ModalSubmitInteraction } from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";

export abstract class Profession {
    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        return undefined!;
    }
}

export default class DonateCommand extends Command.Base {
    public override main = new Command.Command(
        "work",
        "Earn some gold!",
        [
            {
                name: "profession",
                description: "The line of work you want to do!",
                type: ApplicationCommandOptionType.String,
                required: false,
                autocomplete: true,
            },
        ],
        this.onExecute.bind(this),
        this.onAutocomplete.bind(this),
    );

    professions: Map<string, Profession> = new Map();

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        await this.load();

        const professionOpt = interaction.options.get("profession", false);
        const professionChoice = professionOpt
            ? (professionOpt.value as string)
            : [...this.professions.keys()][Globals.random(0, [...this.professions.keys()].length)] || "";

        const user = await AppUser.fromID(interaction.user.id);
        await user.addGold(1).save();

        const profession = this.professions.get(professionChoice);
        if (!profession) return interaction.reply(`Profession not found: '${profession}'`);

        return await profession.onExecute(interaction);
    }

    public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        await this.load();

        const professions = [...this.professions.keys()];

        const options = professions.map((profession) => ({
            name: profession.charAt(0).toUpperCase() + profession.slice(1),
            value: profession,
        }));

        await interaction.respond(options);
    }

    async load() {
        const glob = new Bun.Glob("src/commands/Work/*.ts");

        for (const path of glob.scanSync(".")) {
            const { default: WorkClass } = await import(path.replace("src/commands/Work/", "./Work/"));
            const profession: Profession = new WorkClass();

            const name = path
                .split("/")
                .pop()
                ?.replace(".ts", "")
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .toLowerCase()!;

            this.professions.set(name, profession);
        }
    }
}
