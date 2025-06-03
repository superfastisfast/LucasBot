import {Client} from "discord.js";
import {MessageResponderService} from "@/outcasts/damon/messageResponderService.ts";
import {DamonsFakeService} from "@/outcasts/damon/DamonsFakeService.ts";

export interface ILogger {
    info(message: string): void;
    error(error: unknown, message?: string): void;
}
export class BotServices {
    private readonly messageResponderService: MessageResponderService;
    private readonly damonsFakeService: DamonsFakeService;

    constructor(
        client: Client,
        private readonly logger: ILogger = console, // default to console
    ) {
        this.messageResponderService = new MessageResponderService(client, logger);
        this.damonsFakeService = new DamonsFakeService(client, logger);
    }

    start(): void {
        this.logger.info('Bot Services starting.');
        this.messageResponderService.start();
        this.damonsFakeService.start();
    }

    stop(): void {
        this.messageResponderService.stop();
        this.damonsFakeService.stop();
        this.logger.info('Bot Services stopped.');
    }
}