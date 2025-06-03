// dicePlayer.ts
    import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    User, type SlashCommandUserOption, type SlashCommandNumberOption,
} from 'discord.js';
    
    const MAX = 100;
    const VERSUS_COOLDOWN_MS = 60_000; // 60 s – adjust as needed
    
    /* -------------------------------------------------------------------------- */
    /*                                Mock wallet                                 */
    /* -------------------------------------------------------------------------- */
    const walletKey = (guildId: string, userId: string) => `${guildId}:${userId}`;
    
    class PlayerWallet {
        private static balances = new Map<string, number>();
    
        /** Current balance (defaults 0) */
        static getBalance(guildId: string, userId: string): number {
            return this.balances.get(walletKey(guildId, userId)) ?? 0;
        }
    
        /** Adds (or subtracts, if negative) `amount` */
        static addToBalance(guildId: string, userId: string, amount: number): void {
            const key = walletKey(guildId, userId);
            this.balances.set(key, this.getBalance(guildId, userId) + amount);
        }
    
        static subtractFromBalance(guildId: string, userId: string, amount: number): void {
            this.addToBalance(guildId, userId, -amount);
        }
    }
    
    /* -------------------------------------------------------------------------- */
    /*                                Cooldowns                                   */
    /* -------------------------------------------------------------------------- */
    const cdKey = (guildId: string, userId: string) => `${guildId}:${userId}`;
    
    class Cooldowns {
        private static versus = new Map<string, number>();
    
        /** Returns epoch-ms when the user may next play (0 = no cooldown) */
        static get(guildId: string, userId: string): number {
            return this.versus.get(cdKey(guildId, userId)) ?? 0;
        }
    
        static set(guildId: string, userId: string, nextAllowedMs: number): void {
            this.versus.set(cdKey(guildId, userId), nextAllowedMs);
        }
    }
    
    /* -------------------------------------------------------------------------- */
    /*                             Slash-command data                             */
    /* -------------------------------------------------------------------------- */
    export const data = new SlashCommandBuilder()
        .setName('diceplayer')
        .setDescription('Roll a random number from 1-100 against another user.')
        .addUserOption((o: SlashCommandUserOption) =>
            o.setName('opponent').setDescription('Who to challenge').setRequired(true),
        )
        .addNumberOption((o: SlashCommandNumberOption) =>
            o
                .setName('bet')
                .setDescription('Cash to wager')
                .setMinValue(0.01)
                .setRequired(true),
        );
        
    /* -------------------------------------------------------------------------- */
    /*                             Command execution                              */
    /* -------------------------------------------------------------------------- */
    export async function execute(interaction: ChatInputCommandInteraction) {
        const opponent = interaction.options.getUser('opponent', true);
        const bet = interaction.options.getNumber('bet', true);
    
        if (bet <= 0) {
            await interaction.reply({ content: 'You must bet some cash!', ephemeral: true });
            return;
        }
        if (!interaction.guildId) {
            await interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true,
            });
            return;
        }
    
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        const opponentId = opponent.id;
        const now = Date.now();
    
        /* Cooldown (opponent) ---------------------------------------------------- */
        const oppCooldown = Cooldowns.get(guildId, opponentId);
        if (now < oppCooldown) {
            const secs = Math.ceil((oppCooldown - now) / 1000);
            await interaction.reply({
                content: `${opponent} was challenged recently. Wait **${secs}s**.`,
                ephemeral: true,
            });
            return;
        }
    
        /* Wallet checks ---------------------------------------------------------- */
        if (PlayerWallet.getBalance(guildId, userId) < bet) {
            await interaction.reply({
                content: `${interaction.user} doesn't have enough cash!`,
                ephemeral: true,
            });
            return;
        }
        if (PlayerWallet.getBalance(guildId, opponentId) < bet) {
            await interaction.reply({
                content: `${opponent} doesn't have enough cash!`,
                ephemeral: true,
            });
            return;
        }
    
        /* Dice rolls ------------------------------------------------------------- */
        const userRoll = Math.floor(Math.random() * MAX) + 1;
        const oppRoll = Math.floor(Math.random() * MAX) + 1;
    
        if (userRoll > oppRoll) {
            PlayerWallet.addToBalance(guildId, userId, bet);
            PlayerWallet.subtractFromBalance(guildId, opponentId, bet);
        } else if (userRoll < oppRoll) {
            PlayerWallet.addToBalance(guildId, opponentId, bet);
            PlayerWallet.subtractFromBalance(guildId, userId, bet);
        }
    
        /* Apply cooldown to opponent -------------------------------------------- */
        Cooldowns.set(guildId, opponentId, now + VERSUS_COOLDOWN_MS);
    
        /* Embed output ----------------------------------------------------------- */
        const header = `🎲 ${interaction.user} vs ${opponent} 🎲`;
        const rolls = `${interaction.user} rolled **${userRoll}**!\n${opponent} rolled **${oppRoll}**!`;
        const outcome =
            userRoll > oppRoll
                ? `${interaction.user} wins! (+$${bet.toFixed(2)})`
                : userRoll < oppRoll
                    ? `${opponent} wins! (+$${bet.toFixed(2)})`
                    : "It's a tie!";
        const balances =
            `New balances ⇒ ${interaction.user}: $${PlayerWallet.getBalance(guildId, userId).toFixed(
                2,
            )}, ${opponent}: $${PlayerWallet.getBalance(guildId, opponentId).toFixed(2)}`;
    
        const embed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle('Dice Game')
            .setDescription(`${header}\n\n${rolls}\n\n${outcome}\n\n${balances}`)
            .setTimestamp()
            .setColor('Blue')
            .setFooter({
                text: `Bet: $${bet.toFixed(2)}`,
                iconURL: interaction.user.displayAvatarURL(),
            });
    
        await interaction.reply({ embeds: [embed] });
    }