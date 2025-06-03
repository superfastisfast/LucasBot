// messageResponderService.ts
import {
    Client,
    Message,
    type EmojiIdentifierResolvable,
    Events,
} from 'discord.js';


export interface ILogger {
    info(message: string): void;
    error(error: unknown, message?: string): void;
}

/* -------------------------------------------------------------------------- */
/*                        Hard-coded user IDs and emojis                       */
/* -------------------------------------------------------------------------- */
const GOOD_USER_ID = '402859016457420820'; // 👍 target
const BAD_USER_ID  = '924027166096752650'; // 👎 target
const THUMBS_UP:  EmojiIdentifierResolvable = '👍';
const THUMBS_DOWN: EmojiIdentifierResolvable = '👎';

/* -------------------------------------------------------------------------- */
/*                            MessageResponderService                         */
/* -------------------------------------------------------------------------- */
export class MessageResponderService {
    private readonly onMessageBound: (msg: Message) => unknown;

    constructor(
        private readonly client: Client,
        private readonly logger: ILogger = console, // default to console
    ) {
        /* Bind once so start/stop can use the same reference */
        this.onMessageBound = (msg: Message) => this.onMessage(msg);
    }

    /** Attach listener */
    start(): void {
        this.logger.info('Message Responder Service starting.');
        this.client.on(Events.MessageCreate, this.onMessageBound);
    }

    /** Detach listener */
    stop(): void {
        this.client.off(Events.MessageCreate, this.onMessageBound);
        this.logger.info('Message Responder Service stopped.');
    }

    /* ------------------------------------------------------------------------ */
    /*                      Internal message-handling logic                     */
    /* ------------------------------------------------------------------------ */
    private async onMessage(msg: Message): Promise<void> {
        if (msg.author.bot) return;

        try {
            if (msg.author.id === GOOD_USER_ID) {
                await msg.react(THUMBS_UP);
                return;
            }
            if (msg.author.id === BAD_USER_ID) {
                await msg.react(THUMBS_DOWN);
                return;
            }
        } catch (err) {
            this.logger.error(err, 'Failed to add reaction.');
        }
    }
}
