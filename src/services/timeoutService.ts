import {
    Client,
    Events,
    GuildMember,
    type PartialGuildMember,
} from "discord.js";
import { UserModel } from "@/models/user";

export interface ILogger {
    info(message: string): void;
    error(error: unknown, message?: string): void;
}

export class TimeoutService {
    constructor(
        private readonly client: Client,
        private readonly logger: ILogger = console,
    ) {}

    start(): void {
        this.logger.info("Timeout Tracking Service starting.");
        this.client.on(Events.GuildMemberUpdate, this.handleGuildMemberUpdate);
    }

    stop(): void {
        this.client.off(Events.GuildMemberUpdate, this.handleGuildMemberUpdate);
        this.logger.info("Timeout Tracking Service stopped.");
    }

    private handleGuildMemberUpdate = async (
        oldMember: GuildMember | PartialGuildMember,
        newMember: GuildMember,
    ): Promise<void> => {
        if (
            !oldMember.communicationDisabledUntil &&
            newMember.communicationDisabledUntil
        ) {
            try {
                const dbUser = await UserModel.findOneAndUpdate(
                    { id: newMember.id },
                    { $inc: { timeouts: 1 }, username: newMember.displayName },
                    { new: true, upsert: true, setDefaultsOnInsert: true },
                );
                this.logger.info(
                    `User ${newMember.displayName} (${newMember.id}) timeout count updated to ${dbUser.timeouts}.`,
                );
            } catch (err) {
                this.logger.error(
                    err,
                    `Failed to update timeout for user ${newMember.id}`,
                );
            }
        }
    };
}
