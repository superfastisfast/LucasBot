import {
    User,
    Guild,
    GuildMember,
    Role,
    PermissionsBitField,
    DiscordAPIError,
    TextChannel,
    EmbedBuilder,
} from "discord.js";
import { StatsModel, UserModel, type IInventory, type IStats, type UserDocument } from "./models/user";
import { client } from ".";
import { Item, type ItemDocument } from "./models/item";

export class AppUser {
    discord: User;
    database: UserDocument;

    private constructor(discordUser: User, databaseUser: UserDocument) {
        this.discord = discordUser;
        this.database = databaseUser;
    }

    static async fromID(userId: string): Promise<AppUser> {
        try {
            const discordUser = await client.users.fetch(userId);
            const databaseUser = await AppUser.getDatabaseUser(discordUser);
            return new AppUser(discordUser, databaseUser);
        } catch (error: any) {
            console.warn(`Failed to fetch user ${userId}: ${error}`);
            throw new Error(`Failed to fetch user`);
        }
    }

    private static async getDatabaseUser(discordUser: User): Promise<UserDocument> {
        try {
            const databaseUser = await UserModel.findOneAndUpdate(
                { id: discordUser.id },
                {
                    $setOnInsert: {
                        id: discordUser.id,
                        username: discordUser.username,
                    },
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                },
            );

            if (!databaseUser) {
                throw new Error("User creation or retrieval returned null.");
            }

            return databaseUser;
        } catch (error) {
            console.error(`Error retrieving or creating user ${discordUser.id}:`, error);
            throw new Error(`Failed to retrieve or create user for ID ${discordUser.id}`);
        }
    }

    async getGuildMember(guild: Guild): Promise<GuildMember> {
        const member = await guild.members.fetch(this.discord.id);

        if (!member) throw new Error(`User with ID "${this.discord.id}" is not a member of the guild "${guild.name}"`);

        return member;
    }

    async setRole(guild: Guild, name: string, state: boolean): Promise<void> {
        try {
            const botMember: GuildMember | null = guild.members.me;
            if (!botMember) throw new Error(`Bot cannot manage member roles in another guild ${guild.name}`);

            if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles))
                throw new Error(`Bot is missing 'Manage Roles' permission in guild "${guild.name}".`);

            const role: Role | undefined = guild.roles.cache.find(
                (role) => role.name.toLowerCase() === new String(name).toLowerCase() || role.id === name,
            );
            if (!role) throw new Error(`Role '${name}' not found in guild '${guild.name}'`);

            if (role.position >= botMember.roles.highest.position)
                throw new Error(
                    `Cannot assign role '${role.name}' because it is equal to or higher than my highest role`,
                );

            // Prevent assigning @everyone
            if (role.id === guild.id) return;

            if (state) (await this.getGuildMember(guild)).roles.add(role);
            else (await this.getGuildMember(guild)).roles.remove(role);
        } catch (error: any) {
            let errorMessage = `Error assigning role "${name}" in guild "${guild.name}" to user "${this.discord.username}": `;

            if (error instanceof DiscordAPIError) {
                errorMessage += `Discord API Error ${error.code}: ${error.message}`;
                if (error.status === 403) {
                    errorMessage += " (Missing permissions or hierarchy issue from Discord's side)";
                }
            } else if (error instanceof Error) {
                errorMessage += error.message;
            } else {
                errorMessage += String(error);
            }

            throw new Error(errorMessage);
        }
    }

    /////////////////////////////////////////////////////////
    ///                      HELPER                        //
    /////////////////////////////////////////////////////////
    setXP(amount: number): AppUser {
        if (amount > 0 && this.database.timeouts > 0) {
            const maxTimeoutsForReduction = 20;
            const minTimeoutsForReduction = 1;
            let reductionFactor =
                (this.database.timeouts - minTimeoutsForReduction) /
                (maxTimeoutsForReduction - minTimeoutsForReduction);
            reductionFactor = Math.max(0, Math.min(1, reductionFactor));
            amount = amount * (1 - reductionFactor);
        }
        this.database.xp = Math.max(-100, amount);

        return this;
    }

    addXP(amount: number): AppUser {
        return this.setXP(this.database.xp + amount);
    }

    setGold(amount: number): AppUser {
        this.database.inventory.gold = Math.max(-1000, amount);

        return this;
    }

    addGold(amount: number): AppUser {
        return this.setGold(this.database.inventory.gold + amount);
    }

    setSkillPoints(amount: number): AppUser {
        this.database.skillPoints = amount;
        return this;
    }

    addSkillPoints(amount: number): AppUser {
        return this.setSkillPoints(this.database.skillPoints + amount);
    }

    upgradeSkill(attribute: string): AppUser {
        (this.database.stats as any)[attribute]++;
        return this;
    }

    async save(): Promise<AppUser> {
        const stats = [
            "strength",
            "agility",
            "charisma",
            "magicka",
            "stamina",
            "defense",
            "vitality",
        ] as (keyof IStats)[];

        stats.forEach((stat) => {
            if ((this.database.stats[stat] as number) < 0) {
                (this.database.stats[stat] as number) = 0;
            }
        });

        await this.level(this.database.xp);
        await this.database.save();
        return this;
    }

    /////////////////////////////////////////////////////////
    ///                      OTHER                         //
    /////////////////////////////////////////////////////////
    equipItem(item: ItemDocument): AppUser {
        const equipmentSlots: Array<keyof IInventory> = [
            "weapon",
            "helmet",
            "chestplate",
            "leggings",
            "boots",
            "shield",
        ];
        if (equipmentSlots.includes(item.tag as keyof IInventory))
            (this.database.inventory as any)[item.tag] = item.name;
        else console.warn(`Failed to applied ${item.name} to ${this.discord.username}'s ${item.tag} slot`);

        return this;
    }

    async getItems(): Promise<ItemDocument[]> {
        const itemNames: string[] = [
            this.database?.inventory.helmet,
            this.database?.inventory.chestplate,
            this.database?.inventory.weapon,
            this.database?.inventory.leggings,
            this.database?.inventory.boots,
            this.database?.inventory.shield,
        ];
        let items: Array<ItemDocument> = [];
        for (const itemName of itemNames) {
            const item = await Item.getFromName(itemName);
            if (item) {
                items.push(item);
            }
        }
        return items;
    }

    static rollRandomDice(minVal: number, val: number): number {
        return Math.max(minVal, val * Math.random());
    }

    async getDisplayStatInfo(): Promise<EmbedBuilder> {
        const statKeys: [keyof IStats, string][] = [
            ["strength", "⚔️"],
            ["agility", "🏃"],
            ["charisma", "🗣️"],
            ["magicka", "✨"],
            ["stamina", "🔋"],
            ["defense", "🛡️"],
            ["vitality", "⛑️"],
        ];

        const maxKeyLength = Math.max(...statKeys.map(([key]) => key.length));
        const maxValueLength = Math.max(...statKeys.map(([key]) => String(this.database.stats[key]).length));

        let statsDisplay = "```";
        for (const [name, emoji] of statKeys) {
            const value = this.database.stats[name];
            const paddedName = `${name}:`.padEnd(maxKeyLength + 2);
            const paddedValue = String(value).padStart(maxValueLength);
            statsDisplay += `\n${emoji} ${paddedName} ${paddedValue}`;
        }
        statsDisplay += "\n```";

        const color = this.discord.accentColor ?? 0x4f545c;

        return new EmbedBuilder()
            .setTitle(`${this.discord.displayName} Stats`)
            .setColor(color)
            .setDescription(statsDisplay)
            .setURL("https://www.youtube.com/@LucasDevelop")
            .setThumbnail(this.discord.avatarURL({}));
    }

    // async getDisplayInfo(): Promise<any> {
    //     const itemsDisplay = Item.getStringCollection(await this.getItems());
    //     const attributesArray = AppUser.getDisplayStats(this.database.stats);
    //     return {
    //         gold: this.database.inventory.gold,
    //         xp: this.database.xp,
    //         level: this.database.level,
    //         skillPoints: this.database.skillPoints,
    //         attributesArray: attributesArray,
    //         items: `📦 Items: \n${itemsDisplay}`,
    //     };
    // }

    async level(xp: number): Promise<void> {
        if (!process.env.QUEST_CHANNEL_ID) throw new Error("QUEST_CHANNEL_ID is not defined in .env");
        const levelChannel = (await client.channels.fetch(process.env.QUEST_CHANNEL_ID)) as TextChannel;

        const level = calculateLevel(xp);

        if (level > this.database.level) {
            this.addSkillPoints(1).addGold(level);
            this.database.level = level;
            await levelChannel.send(`${this.discord} is now level ${level}!`);
        }

        const guildId = levelChannel.guild.id;
        const guild: Guild | undefined = await client.guilds.fetch(guildId);

        const rank = rankFromLevel(level) || "";
        if (rank === "") return;

        this.setRole(guild, rank, true);
    }
}

const xpThresholds: number[] = [
    //  XP           Level
    0, //              0
    1, //              1
    50, //             2
    100, //            3
    250, //            4
    500, //            5
    1000, //           6
    1750, //           7
    2750, //           8
    4000, //           9
    5000, //          10
    7500, //          11
    9500, //          12
    10250, //         13
    15250, //         14
    20000, //         15
];

function calculateLevel(xp: number): number {
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
        if (xp >= (xpThresholds[i] || xpThresholds[xpThresholds.length - 1]! * 2)) return i;
    }
    return 0;
}

function rankFromLevel(level: number): string | undefined {
    if (level > 0 && level % 5 === 0) return `Level ${level}`;
    return undefined;
}
