import { Command } from "@/command";
import { SlashCommandBuilder, type Client, type CommandInteraction } from "discord.js";

export default class GlobCommand extends Command {
    override get info(): any {
        console.log("info called");
        return new SlashCommandBuilder()
            .setName("globglogabgalab")
            .setDescription("Summons a globglogabgelab")
            .toJSON();
    }

    override async execute(client: Client, interaction: CommandInteraction): Promise<void> {
        const songs: string[] = [
            "hLljd8pfiFg", 
            "cIwRQwAS_YY", 
            "7C5zM8CnZF0",
            "2vhQBN0xJJ8",
            "47ZSI7nPAqo",
            "xnl0iddwELA",
            "geWmx4YnRZA",
            "ZSAypaq7log",
            "a-QpDm0A3Ng",
            "Kw12RyxCHTc",
            "lCS3y1qn4C8",
            "DVQsKYPm7mA",
            "xrIgihGpcXg",
            "slogfEswemE",
            "-pQnurfQZPI",
            "wSXIblva5No",
            "5xHPG-Cv3t0",
            "OT4MyqrWo6E",
            "_OFN2Uztp34",
            "WMemX2uKUNI",
            "7XBjuDkXJ60",
            "uQASsDVChTQ",
            "FSAibrRAUjM",
            "HUBdfxwWnxA",
            "nV-ypF0L6Xs EAR WARNING!",
            "TtqMwwfhErQ",
            "CaWT1ayLyB0",
            "wEpJU3xqeSE",
            "okZNjPP1VQ4",
            "-XBaIpW--T4",
            "uPmNlnGNEqw",
            "e5WwKh5Nuqo",
            "G_hsLsKJmMM",
            "ogcC6HHzXQg",
            "3pDdF4WC6mw",
            "NqAFlFE-b98",
            "YHxhHz0tBqA",
            "oVk0NP02zLs",
            "oS0kaazgJTQ",
            "GfgFuytAWGw",
            "vwyOoX7VGTA"
        ];

        const min = Math.ceil(0);
        const max = Math.floor(songs.length - 1);
        const random = Math.floor(Math.random() * (max - min + 1)) + min;

        await interaction.reply("https://www.youtube.com/watch?v=" + songs[random] + "&list=PLkc09h6aA5tJWVrawBU0NT3m04uwdcirU&index=" + random);
    }
}
