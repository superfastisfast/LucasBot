// src/system/timeoutTrackingService.ts
import { Client, Events, GuildMember, type PartialGuildMember } from "discord.js";
import { UserModel } from "@/models/user";

export interface ILogger {
    info(message: string): void;
    error(error: unknown, message?: string): void;
}

export class TimeoutService {
    private readonly onGuildMemberUpdateBound: (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => unknown;

    constructor(
        private readonly client: Client,
        private readonly logger: ILogger = console, // default to console
    ) {
        this.onGuildMemberUpdateBound = (oldMember, newMember) => this.onGuildMemberUpdate(oldMember, newMember);
    }

    start(): void {
        this.logger.info('Timeout Tracking Service starting.');
        this.client.on(Events.GuildMemberUpdate, this.onGuildMemberUpdateBound);
    }

    stop(): void {
        this.client.off(Events.GuildMemberUpdate, this.onGuildMemberUpdateBound);
        this.logger.info('Timeout Tracking Service stopped.');
    }

    private async onGuildMemberUpdate(
        oldMember: GuildMember | PartialGuildMember,
        newMember: GuildMember,
    ): Promise<void> {
        const wasTimedOut = oldMember.communicationDisabledUntil;
        const isTimedOut = newMember.communicationDisabledUntil;

        // Check if the member was not timed out before and is timed out now
        if (!wasTimedOut && isTimedOut) {
            try {
                let dbUser = await UserModel.findOne({ id: newMember.id });
                if (dbUser) {
                    dbUser.timeouts += 1;
                    await dbUser.save();
                    this.logger.info(`User ${newMember.displayName} (${newMember.id}) timeout count updated to ${dbUser.timeouts}.`);
                } else {
                    dbUser = await UserModel.create({
                        id: newMember.id,
                        username: newMember.displayName,
                        timeouts: 1,
                    });
                    this.logger.info(`User ${newMember.displayName} (${newMember.id}) created with timeout count 1.`);
                }
            } catch (err) {
                this.logger.error(err, `Failed to update timeout for user ${newMember.id}`);
            }
        }
    }
}