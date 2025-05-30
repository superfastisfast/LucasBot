import type { Client, CommandInteraction } from "discord.js";

export abstract class Command {
    abstract get info(): any;
    abstract execute(client: Client, interaction: CommandInteraction): Promise<void>;
}
