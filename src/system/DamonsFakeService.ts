import {Client, Events, Message,} from 'discord.js';
export interface ILogger {
    info(message: string): void;
    error(error: unknown, message?: string): void;
}

/* -------------------------------------------------------------------------- */

export class DamonsFakeService {
    private readonly onMessageBound: (msg: Message) => unknown;

    constructor(
        private readonly client: Client,
        private readonly logger: ILogger = console, // default to console
    ) {
        this.onMessageBound = (msg: Message) => this.onMessage(msg);
    }

    start(): void {
        this.logger.info('Damons Fake Service starting.');
        this.client.on(Events.MessageCreate, this.onMessageBound);
    }

    stop(): void {
        this.client.off(Events.MessageCreate, this.onMessageBound);
        this.logger.info('Damons Fake Service stopped.');
    }

    /* ------------------------------------------------------------------------ */
    /*                      Internal message-handling logic                     */
    /* ------------------------------------------------------------------------ */
    private async onMessage(msg: Message): Promise<void> {
        if (msg.author.bot) return;

        try {
            if (msg.content.includes("Damon")) {
                await msg.reply("This is a fake service for testing purposes.");
            }
        } catch (err) {
            this.logger.error(err, 'Failed to respond to message.');
        }
    }
}