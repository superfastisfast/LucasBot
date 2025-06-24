import { Command } from "@/commands";
import {
    CommandInteraction,
    InteractionResponse,
    ApplicationCommandOptionType,
    EmbedBuilder,
    ButtonInteraction,
    type InteractionUpdateOptions,
} from "discord.js";
import { AppUser } from "../user";
import { Globals } from "..";
import { UserDB } from "@/models/user";
import { AppButton } from "@/ui";
import { Item } from "@/models/item";

export default class ProfileCommand extends Command.Base {
    public override main: Command.Command = new Command.Command(
        "profile",
        "Display your profile",
        [{ name: "user", description: "Who do you want to stalk?", type: ApplicationCommandOptionType.User }],
        this.onExecute.bind(this),
    );

    buttons: AppButton[] = [];

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const userOpt = (interaction.options.get("user") || interaction).user;
        if (!userOpt) return interaction.reply(`Failed to get user option`);
        const user = await AppUser.fromID(userOpt.id);

        if (this.buttons.length <= 0) this.buttons = await this.generateButtons();

        const actionRow = user.database.skillPoints >= 1 ? AppButton.createActionRow(this.buttons) : undefined;

        const embed = await this.generateEmbed(user);
        return await interaction.reply({
            embeds: [embed],
            components: user.discord.id === interaction.user.id ? actionRow : undefined,
            flags: "Ephemeral",
        });
    }

    private async generateEmbed(user: AppUser): Promise<EmbedBuilder> {
        const statsData = UserDB.StatDB.keys.map((key) => ({
            name: Globals.ATTRIBUTES[key].name,
            emoji: Globals.ATTRIBUTES[key].emoji,
            value: user.database.stats[key],
        }));

        const maxNameLength = Math.max(...statsData.map((stat) => stat.name.length));

        const statString = statsData
            .map((stat) => {
                const padded = stat.name.padEnd(maxNameLength, " ");
                return `${stat.emoji} ${padded}: ${stat.value} + ${(user.getStat(stat.name.toLowerCase() as UserDB.StatDB.Type) - stat.value).toFixed(2)}`;
            })
            .join("\n");

        const inventoryLines = [...user.inventory.items]
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([equipped, name]) => `${equipped ? "✅" : "❌"} ${name} - ${Item.manager.findByName(name)?.type}`);

        const inventoryString = inventoryLines.length > 0 ? "```" + inventoryLines.join("\n") + "```" : "No items...";

        return new EmbedBuilder()
            .setTitle(`${user.discord.displayName}'s Profile`)
            .setDescription(
                `${Globals.ATTRIBUTES.level.emoji} ${user.database.level}\n${Globals.ATTRIBUTES.xp.emoji} ${user.database.xp}\n${Globals.ATTRIBUTES.skillpoint.emoji} ${user.database.skillPoints.toFixed(2)}\n\n**Stats**\n\`\`\`\n${statString}\n\`\`\`\n` +
                    `**Inventory**\n${Globals.ATTRIBUTES.gold.emoji} ${user.inventory.gold.toFixed(2)}\n\n${inventoryString}`,
            )
            .setColor(user.discord.hexAccentColor || 0x3498db)
            .setThumbnail(user.discord.avatarURL())
            .setFooter({ text: "Profile displayed" })
            .setTimestamp();
    }

    private async generateButtons(): Promise<AppButton[]> {
        let buttons: AppButton[] = [];

        UserDB.StatDB.keyArray.forEach((key) => {
            buttons.push(
                new AppButton(
                    `${Globals.ATTRIBUTES[key as keyof typeof Globals.ATTRIBUTES].emoji} ${Globals.ATTRIBUTES[key as keyof typeof Globals.ATTRIBUTES].name}`,
                    async (interaction: ButtonInteraction) => {
                        const user = await AppUser.fromID(interaction.user.id);
                        if (user.database.skillPoints >= 1) {
                            user.database.stats[key as UserDB.StatDB.Type] += 1;
                            await user.addSkillPoints(-1).save();

                            const embed = await this.generateEmbed(user);

                            let options: InteractionUpdateOptions = {};
                            options.embeds = [embed];
                            if (user.database.skillPoints < 1) options.components = [];
                            interaction.update(options);
                        } else {
                            interaction.reply({
                                content: "You don't have enough skillpoints",
                                flags: "Ephemeral",
                            });
                        }
                    },
                ),
            );
        });

        return buttons;
    }
}
