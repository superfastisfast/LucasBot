import { Client, GatewayIntentBits, Events } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    client.on(Events.MessageCreate, msg => {
        if (msg.content === "peng")
            msg.reply("pang");
        console.log(msg.content);
    });

});


client.login(process.env.BOT_TOKEN);




