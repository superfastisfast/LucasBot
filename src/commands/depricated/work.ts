import { Command } from "@/commands";
import { CommandInteraction, InteractionResponse, ApplicationCommandOptionType, AutocompleteInteraction, ModalSubmitInteraction } from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";
import { AppModal } from "@/ui";

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

        const user = await AppUser.fromID(interaction.user.id);
        await user.addGold(1).save();

        const profession = this.professions.get(
            professionOpt
                ? (professionOpt.value as string)
                : [...this.professions.keys()][Globals.random(0, [...this.professions.values()].length - 1)]!,
        )!;

        return (await interaction.showModal(profession.modal.builder)) as any;
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
        console.log(`Loaded profession:`);

        for (const path of glob.scanSync(".")) {
            const { default: WorkClass } = await import(path.replace("src/commands/Work/", "./Work/"));
            const profession: Profession = new WorkClass();

            const name = path
                .split("/")
                .pop()
                ?.replace(".ts", "")
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .toLowerCase()!;

            console.log(`\t${name}`);
            this.professions.set(name, profession);
        }
    }
}

export abstract class Profession {
    public modal: AppModal;

    constructor(modal: AppModal) {
        this.modal = modal;
    }
}
