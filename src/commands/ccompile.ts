import { Command } from "@/commands";
import {
    CommandInteraction,
    InteractionResponse,
    Message,
} from "discord.js";
import { tmpdir } from "os";
import { join } from "path";
import { writeFileSync, mkdirSync, rmSync, chmodSync } from "fs";
import { setInterval, clearInterval } from "timers";

export default class CCompileCommand extends Command.Base {
    public override main: Command.Command = new Command.Command(
        "ccompile",
        "Compile C code from your next message and show the output",
        [],
        this.onExecute.bind(this),
    );

    private extractCode(content: string): string {
        // users love to format their code in ```, so we try to extract it
        const match = content.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        if (match && match[1]) return match[1];
        return content;
    }

    public async onExecute(interaction: CommandInteraction): Promise<InteractionResponse<boolean>> {
        const resp = await interaction.reply({
            content: "The contents of **your next** message will be compiled to C using `clang` and executed from a `x86_64 GNU + Linux` machine.",
            flags: "Ephemeral",
        });

        const channel = interaction.channel;
        if (!channel) return resp;

        const filter = (m: Message) => m.author.id === interaction.user.id;
        const collector = channel.createMessageCollector({ filter, max: 1, time: 120_000 });

        collector.on("collect", async (msg: Message) => {
            const code = this.extractCode(msg.content);

            const frames = ["|", "/", "-", "\\\\"];
            let frameIdx = 0;
            let phase: "compile" | "run" = "compile";
            const progressMsg = await interaction.followUp({ content: `[1/2] Compile ${frames[0]}` });
            let anim: NodeJS.Timeout = setInterval(async () => {
                frameIdx = (frameIdx + 1) % frames.length;
                const frame = frames[frameIdx];
                const content = phase === "compile"
                    ? `[1/2] Compile ${frame}`
                    : `[1/2] Compile / OK\n[2/2] Run ${frame}`;
                try {
                    await progressMsg.edit({ content });
                } catch { /* ignore */ }
            }, 400);

            // container work dir
            const dir = join(tmpdir(), `ccompile-${Date.now()}-${Math.random().toString(36).slice(2)}`);
            mkdirSync(dir, { recursive: true });
            chmodSync(dir, 0o777); // let container root write
            writeFileSync(join(dir, "main.c"), code, "utf8");

            const dockerImg = "gcc:13";
            const mount = `${dir}:/src`;

            // compile 
            const compileProc = Bun.spawn([
                "docker",
                "run",
                "--rm",
                "-v",
                mount,
                "-w",
                "/src",
                "--network",
                "none",
                "--cpus",
                "0.5",
                "--memory",
                "256m",
                "--pids-limit",
                "64",
                "--security-opt",
                "no-new-privileges",
                "--cap-drop",
                "ALL",
                dockerImg,
                "sh",
                "-c",
                "gcc main.c -o main 2>&1",
            ], { stdout: "pipe", stderr: "pipe" });
            const compileExit = await compileProc.exited;
            const compileStdout = await new Response(compileProc.stdout).text();
            const compileStderr = await new Response(compileProc.stderr).text();
            if (compileExit !== 0) {
                clearInterval(anim);
                const out = (compileStdout + compileStderr).trim();
                const clipped = out.length > 1900 ? out.slice(0, 1900) + "\n...[truncated]" : out;
                await progressMsg.edit({ content: `[1/2] Compile / FAIL\n\`\`\`ansi\n${clipped}\n\`\`\`` });
                rmSync(dir, { recursive: true, force: true });
                return;
            }

            clearInterval(anim);
            await progressMsg.edit({ content: `[1/2] Compile / OK ` });
            phase = "run";
            frameIdx = 0;
            anim = setInterval(async () => {
                frameIdx = (frameIdx + 1) % frames.length;
                const frame = frames[frameIdx];
                try {
                    await progressMsg.edit({ content: `[1/2] Compile / OK\n[2/2] Run ${frame}` });
                } catch { }
            }, 200);

            // run
            const runRes = Bun.spawnSync([
                "docker",
                "run",
                "--rm",
                "-v",
                `${dir}:/src:ro`,
                "-w",
                "/src",
                "--network",
                "none",
                "--cpus",
                "0.5",
                "--memory",
                "128m",
                "--pids-limit",
                "64",
                "--security-opt",
                "no-new-privileges",
                "--cap-drop",
                "ALL",
                dockerImg,
                "sh",
                "-c",
                "./main",
            ]);

            clearInterval(anim);
            const output = (runRes.stdout.toString() + runRes.stderr.toString()).trim();
            const clippedOut = output.length > 1900 ? output.slice(0, 1900) + "\n...[truncated]" : output;
            await progressMsg.edit({
                content: `\`\`\`ansi\n${clippedOut}\n\`\`\``,
            });

            rmSync(dir, { recursive: true, force: true });
        });

        collector.on("end", async (_collected, reason) => {
            if (reason === "time") {
                await interaction.followUp({
                    content: "Timed out waiting for code message.",
                    flags: "Ephemeral",
                });
            }
        });

        return resp;
    }
}
