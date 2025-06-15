import {
    SlashCommandBuilder,
    InteractionResponse,
    AutocompleteInteraction,
    CommandInteraction,
    SlashCommandSubcommandBuilder,
    ApplicationCommandOptionType,
    ChannelType,
} from "discord.js";
import { client } from ".";

export namespace NewCommand {
    export abstract class Base {
        public abstract main: Command;
        public subs: Command[] = [];

        public name: string = undefined!;

        public get slash(): SlashCommandBuilder {
            const builder = new SlashCommandBuilder().setName(this.main.name).setDescription(this.main.description);

            // Add options for the main command
            if (this.main.options && this.main.options.length > 0) {
                applyOptionsToDiscordBuilder(builder, this.main.options);
            }

            // Add subcommands
            this.subs.forEach((subCommand) => {
                const subBuilder = new SlashCommandSubcommandBuilder()
                    .setName(subCommand.name)
                    .setDescription(subCommand.description);

                // Add options for each subcommand
                if (subCommand.options && subCommand.options.length > 0) {
                    applyOptionsToDiscordBuilder(subBuilder, subCommand.options);
                }

                builder.addSubcommand(subBuilder);
            });

            return builder;
        }

        get class(): new (...args: any[]) => this {
            return this.constructor as new (...args: any[]) => this;
        }
    }

    function applyOptionsToDiscordBuilder<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder>(
        builder: T,
        options: Option[],
    ): T {
        for (const option of options) {
            switch (option.type) {
                case ApplicationCommandOptionType.String:
                    builder.addStringOption((opt) => {
                        opt.setName(option.name).setDescription(option.description);
                        if (option.required !== undefined) opt.setRequired(option.required);
                        if (option.autocomplete !== undefined) opt.setAutocomplete(option.autocomplete);

                        // --- FIX FOR STRING CHOICES ---
                        // Type guard: Check if 'choices' property exists AND its type is correct
                        if (
                            "choices" in option &&
                            option.choices &&
                            option.type === ApplicationCommandOptionType.String
                        ) {
                            // TypeScript now knows option.choices is { name: string; value: string }[]
                            opt.addChoices(...option.choices);
                        }
                        if ("min_length" in option && option.min_length !== undefined)
                            opt.setMinLength(option.min_length);
                        if ("max_length" in option && option.max_length !== undefined)
                            opt.setMaxLength(option.max_length);
                        return opt;
                    });
                    break;
                case ApplicationCommandOptionType.Integer:
                    builder.addIntegerOption((opt) => {
                        opt.setName(option.name).setDescription(option.description);
                        if (option.required !== undefined) opt.setRequired(option.required);
                        if (option.autocomplete !== undefined) opt.setAutocomplete(option.autocomplete);

                        // --- FIX FOR INTEGER CHOICES ---
                        if (
                            "choices" in option &&
                            option.choices &&
                            option.type === ApplicationCommandOptionType.Integer
                        ) {
                            // TypeScript now knows option.choices is { name: string; value: number }[]
                            opt.addChoices(...option.choices);
                        }
                        if ("min_value" in option && option.min_value !== undefined) opt.setMinValue(option.min_value);
                        if ("max_value" in option && option.max_value !== undefined) opt.setMaxValue(option.max_value);
                        return opt;
                    });
                    break;
                case ApplicationCommandOptionType.Number:
                    builder.addNumberOption((opt) => {
                        opt.setName(option.name).setDescription(option.description);
                        if (option.required !== undefined) opt.setRequired(option.required);
                        if (option.autocomplete !== undefined) opt.setAutocomplete(option.autocomplete);

                        // --- FIX FOR NUMBER CHOICES ---
                        if (
                            "choices" in option &&
                            option.choices &&
                            option.type === ApplicationCommandOptionType.Number
                        ) {
                            // TypeScript now knows option.choices is { name: string; value: number }[]
                            opt.addChoices(...option.choices);
                        }
                        if ("min_value" in option && option.min_value !== undefined) opt.setMinValue(option.min_value);
                        if ("max_value" in option && option.max_value !== undefined) opt.setMaxValue(option.max_value);
                        return opt;
                    });
                    break;
                // ... (rest of your cases remain the same as they don't involve 'choices')
                case ApplicationCommandOptionType.Boolean:
                    builder.addBooleanOption((opt) => {
                        opt.setName(option.name).setDescription(option.description);
                        if (option.required !== undefined) opt.setRequired(option.required);
                        return opt;
                    });
                    break;
                case ApplicationCommandOptionType.User:
                    builder.addUserOption((opt) => {
                        opt.setName(option.name).setDescription(option.description);
                        if (option.required !== undefined) opt.setRequired(option.required);
                        return opt;
                    });
                    break;
                case ApplicationCommandOptionType.Role:
                    builder.addRoleOption((opt) => {
                        opt.setName(option.name).setDescription(option.description);
                        if (option.required !== undefined) opt.setRequired(option.required);
                        return opt;
                    });
                    break;
                case ApplicationCommandOptionType.Mentionable:
                    builder.addMentionableOption((opt) => {
                        opt.setName(option.name).setDescription(option.description);
                        if (option.required !== undefined) opt.setRequired(option.required);
                        return opt;
                    });
                    break;
                case ApplicationCommandOptionType.Attachment:
                    builder.addAttachmentOption((opt) => {
                        opt.setName(option.name).setDescription(option.description);
                        if (option.required !== undefined) opt.setRequired(option.required);
                        return opt;
                    });
                    break;
            }
        }
        return builder;
    }

    export class Command {
        name: string;
        description: string;
        options: Option[];
        onExecute: (interaction: CommandInteraction) => Promise<InteractionResponse<boolean>>;
        onAutocomplete: (interaction: AutocompleteInteraction) => Promise<void>;

        constructor(
            name: string,
            description: string,
            options: Option[],
            onExecute: (interaction: CommandInteraction) => Promise<InteractionResponse<boolean>>,
            onAutocomplete: (interaction: AutocompleteInteraction) => Promise<void> = (
                interaction: AutocompleteInteraction,
            ) => {
                return interaction.respond([]);
            },
        ) {
            this.name = name;
            this.description = description;
            this.options = options;
            this.onExecute = onExecute;
            this.onAutocomplete = onAutocomplete;
        }
    }

    export type Option = {
        name: string;
        description: string; // Add description, it's required for Discord options
        required?: boolean;
        autocomplete?: boolean;
    } & (
        | {
              type: ApplicationCommandOptionType.String;
              choices?: { name: string; value: string }[];
              min_length?: number;
              max_length?: number;
          }
        | {
              type: ApplicationCommandOptionType.Integer;
              choices?: { name: string; value: number }[];
              min_value?: number;
              max_value?: number;
          }
        | {
              type: ApplicationCommandOptionType.Number;
              choices?: { name: string; value: number }[];
              min_value?: number;
              max_value?: number;
          }
        | { type: ApplicationCommandOptionType.Boolean }
        | { type: ApplicationCommandOptionType.User }
        | { type: ApplicationCommandOptionType.Role }
        | { type: ApplicationCommandOptionType.Mentionable }
        | { type: ApplicationCommandOptionType.Attachment }
    );

    export const commands: Map<string, Base> = new Map();

    export async function load() {
        const glob = new Bun.Glob("src/new_commands/*.ts");
        console.log(`Loaded new commands:`);

        for (const path of glob.scanSync(".")) {
            const file = Bun.file(path);

            const { default: CommandClass } = await import(path.replace("src/new_commands/", "./new_commands/"));
            const command: Base = new CommandClass();

            const name = path
                .split("/")
                .pop()
                ?.replace(".ts", "")
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .toLowerCase()!;
            command.name = name;

            console.log(`\t${name}`);
            commands.set(name, command);

            console.log(command.slash.toJSON());

            client.application?.commands.create(command.slash.toJSON());
        }
    }

    export async function execute(name: string) {
        try {
            const old = await commands.get(name);
            if (!old) return console.log(`Failed to get quest: '${name}'`);
            const quest = new old.class();
            quest.name = old.name;
            // await quest.execute();

            commands.set(name, quest);
        } catch (error) {
            console.error(`Failed to execute command: ${name}`, error);
        }
    }
}
