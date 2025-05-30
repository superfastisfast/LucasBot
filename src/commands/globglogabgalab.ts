import { Command } from "@/command";
import { SlashCommandBuilder, type Client, type CommandInteraction } from "discord.js";

export default class GlobCommand extends Command {
    override get info(): any {
        console.log("info called");
        return new SlashCommandBuilder()
            .setName("globglogabgalab")
            .setDescription("Summons a globglogabgelab https://www.imdb.com/title/tt8141808/")
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
            "lCS3y1qn4C8",
            "DVQsKYPm7mA",
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
            "nV-ypF0L6Xs :warning: EAR WARNING!",
            "TtqMwwfhErQ",
            "CaWT1ayLyB0",
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
            "vwyOoX7VGTA",
            "A9cVvHv8j2o",
            "TO5xjH3wgpc",
            "52Li3SLj1gE", // Santa??
            "bfBjUUWvaHg",
            "LifQbgwfF5M",
            "vwyOoX7VGTA",
            "zUYJJ5wZulY",
            "M9V2l5KDMGY",
            "Hh-soLTb2uo",
            "nmjHp_EkR9U",
            "O5QAJQzeYas",
            "dDTKAwikm94",
            "9PT4UnsUvNw",
            "rCm-R4nZM1s",
            "OvVWcb8KhPs",
            "70jd1P6dQDs",
            "xnl0iddwELA",
            "bUEBTr4cImY",
            "89c4Y59z2rc",
            "eHN3rbUWENI",
            "CVWE9BPo0g0 :flag_se:",
            "lWO8TLqAwNU",
        ];

        const min = Math.ceil(0);
        const max = Math.floor(songs.length - 1);
        const random = Math.floor(Math.random() * (max - min + 1)) + min;

        await interaction.reply("https://www.youtube.com/watch?v=" + songs[random]);
    }
}
