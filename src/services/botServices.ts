// src/outcasts/damon/botServices.ts
import {Client} from "discord.js";
import {MessageResponderService} from "@/services/messageResponderService.ts";
import {DamonsFakeService} from "@/services/DamonsFakeService.ts";
import { TimeoutService } from "@/services/timeoutService"; // Added import

export interface ILogger {
    info(message: string): void;
    error(error: unknown, message?: string): void;
}
export class BotServices {
    private readonly messageResponderService: MessageResponderService;
    private readonly damonsFakeService: DamonsFakeService;
    private readonly timeoutTrackingService: TimeoutService; // Added service

    constructor(
        client: Client,
        private readonly logger: ILogger = console, // default to console
    ) {
        this.messageResponderService = new MessageResponderService(client, logger);
        this.damonsFakeService = new DamonsFakeService(client, logger);
        this.timeoutTrackingService = new TimeoutService(client, logger); // Instantiate new service
    }

    start(): void {
        this.logger.info('Bot Services starting.');
        this.messageResponderService.start();
        this.damonsFakeService.start();
        this.timeoutTrackingService.start(); // Start new service
    }

    stop(): void {
        this.messageResponderService.stop();
        this.damonsFakeService.stop();
        this.timeoutTrackingService.stop(); // Stop new service
        this.logger.info('Bot Services stopped.');
    }
}