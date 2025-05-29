import { Client, GatewayIntentBits, Events, Message } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});



class Command {
    protected name: string;
    constructor(name: string) {
        this.name = name;
    }

    public async execute(message: Message, args: string[]): Promise<void> { }
    public getName(): string {
        return this.name;
    }
}





class PingCommand extends Command {
    constructor() {
        super("ping");
    }

    public override async execute(message: Message, args: string[]): Promise<void> {
        await message.reply("Pong!");
        console.log("Ping executed!", args);
    }
}


const commands: Map<string, Command> = new Map();
commands.set("ping", new PingCommand());
commands.set("uwu", new PingCommand());


client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    client.on(Events.MessageCreate, async (msg) => {

        const { content } = msg;

        //!ping
        //bun run --watch index.ts

        if (content.startsWith("!")) {
            const args = content.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = commands.get(commandName);
            if (command) {
                await command.execute(msg, args)
            }
        }

        console.log(msg.content);
    });

});


client.login(process.env.BOT_TOKEN);




