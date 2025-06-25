import { Command } from "@/commands";
import {
    CommandInteraction,
    InteractionResponse,
    Message,
} from "discord.js";
import { tmpdir } from "os";
import { join } from "path";
import { writeFileSync, mkdirSync, rmSync, chmodSync } from "fs";
import { setInterval, clearInterval, setTimeout, clearTimeout } from "timers";

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
            content: "The contents of **your next** message will be compiled to C using `gcc` and executed from a `x86_64 GNU + Linux` machine.",
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
            const mount = `${dir}:/src:rw`;
            // unique container names for compile & run so we can force-kill them if needed
            const containerBuild = `ccompile-build-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const containerRun = `ccompile-run-${Date.now()}-${Math.random().toString(36).slice(2)}`;

            // timeout actually is the best thing we can do!
            // it's 15 seconds for compile and 5 seconds for run, which is plenty enough for normal programs
            //
            // NOTE: I have noticed that usually the actual time it takes for any of the steps to timeout is a little bit higher, 
            // for example, run step can be from 6 to 10 seconds.
            const COMPILE_TIMEOUT_MS = 15000;
            const RUN_TIMEOUT_MS = 5000;

            /*
            * compile step
            * for convinience, here's description of all the flags:
            * --rm                 : remove container after exit
            * --pull never         : never pull image at runtime (supply only pre-pulled digest)
            * -v <dir>:/src:rw     : bind-mount temp build dir read-write
            * -w /src              : set working directory
            * --network none       : disable all network access
            * --user 65534:65534   : run as UID/GID nobody (no privileges)
            * --read-only          : make container rootfs read-only (mount stays rw)
            * --tmpfs /tmp:…       : scratch tmpfs for compiler, limited size, exec allowed
            * --cpus 1             : 1 logical CPU
            * --memory 256m        : 256 MB RAM hard limit
            * --memory-swap 256m   : disable extra swap use
            * --pids-limit 64      : cap number of processes / threads
            * --ipc none           : no shared memory / semaphores
            * --cgroupns private   : isolate cgroups to stop introspection of host hierarchy
            * --security-opt no-new-privileges : block setuid binaries and cap escalation
            * --cap-drop ALL       : drop all remaining Linux capabilities
            */
            const compileProc = Bun.spawn([
                "docker",
                "run",
                "--rm",
                "--pull", "never",
                "-v",
                mount,
                "--name", containerBuild,
                "-w",
                "/src",
                "--network", "none",
                "--user", "65534:65534",
                "--read-only",
                "--tmpfs", "/tmp:exec,mode=1777,size=16m",
                "--cpus", "1",
                "--memory", "256m",
                "--memory-swap", "256m",
                "--pids-limit", "64",
                "--ipc", "none",
                "--ulimit", "nofile=256:256",
                "--ulimit", "core=0",
                "--cgroupns", "private",
                "--security-opt", "no-new-privileges",
                "--cap-drop", "ALL",
                dockerImg,
                "sh",
                "-c",
                "gcc main.c -o main 2>&1",
            ], { stdout: "pipe", stderr: "pipe" });
            let compileTimedOut = false;
            const compileExit: number = await Promise.race([
                compileProc.exited,
                new Promise<number>((resolve) => {
                    setTimeout(() => {
                        compileTimedOut = true;
                        try { compileProc.kill("SIGKILL"); } catch { /* ignore */ }
                        try { Bun.spawnSync(["docker", "rm", "-f", containerBuild]); } catch { /* ignore */ }
                        resolve(-1);
                    }, COMPILE_TIMEOUT_MS);
                })
            ]);
            let compileStdout = "";
            let compileStderr = "";
            if (!compileTimedOut) {
                compileStdout = await new Response(compileProc.stdout).text();
                compileStderr = await new Response(compileProc.stderr).text();
            }
            if (compileTimedOut || compileExit !== 0) {
                clearInterval(anim);
                const out = (compileStdout + compileStderr).trim();
                const clipped = out.length > 1900 ? out.slice(0, 1900) + "\n...[truncated]" : out;
                await progressMsg.edit({
                    content: `${compileTimedOut ? "[1/2] Compile / TIMEOUT" : "[1/2] Compile / FAIL"}\n\`\`\`ansi\n${clipped}\n\`\`\``
                });
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

            /*
             * run step
             * almost same as compile
             * --rm                 : auto-remove
             * --pull never         : no image pulls
             * -v <dir>:/src:ro     : bind-mount code read-only
             * -w /src              : working directory
             * --network none       : no network
             * --user 65534:65534   : nobody user
             * --read-only          : rootfs read-only
             * --tmpfs /tmp:…       : small tmpfs for runtime scratch
             * --cpus 0.5           : half CPU
             * --memory 128m        : 128 MB RAM
             * --memory-swap 128m   : no extra swap
             * --pids-limit 64      : process cap
             * --ipc none, --cgroupns private
             * --security-opt no-new-privileges, --cap-drop ALL
             */
            const runProc = Bun.spawn([
                "docker",
                "run",
                "--rm",
                "--pull", "never",
                "-v",
                `${dir}:/src:ro`,
                "--name", containerRun,
                "-w",
                "/src",
                "--network", "none",
                "--user", "65534:65534",
                "--read-only",
                "--tmpfs", "/tmp:exec,mode=1777,size=8m",
                "--cpus", "0.5",
                "--memory", "128m",
                "--memory-swap", "128m",
                "--pids-limit", "64",
                "--ipc", "none",
                "--ulimit", "nofile=256:256",
                "--ulimit", "core=0",
                "--cgroupns", "private",
                "--security-opt", "no-new-privileges",
                "--cap-drop", "ALL",
                dockerImg,
                "sh",
                "-c",
                "./main",
            ], { stdout: "pipe", stderr: "pipe" });
            let runTimedOut = false;
            const runExit: number = await Promise.race([
                runProc.exited,
                new Promise<number>((resolve) => {
                    setTimeout(() => {
                        runTimedOut = true;
                        try { runProc.kill("SIGKILL"); } catch { }
                        try { Bun.spawnSync(["docker", "rm", "-f", containerRun]); } catch { /* ignore */ }
                        resolve(-1);
                    }, RUN_TIMEOUT_MS);
                })
            ]);

            clearInterval(anim);
            let runStdout = "";
            let runStderr = "";
            if (!runTimedOut) {
                runStdout = await new Response(runProc.stdout).text();
                runStderr = await new Response(runProc.stderr).text();
            }
            const output = (runStdout + runStderr).trim();
            const clippedOut = output.length > 1900 ? output.slice(0, 1900) + "\n...[truncated]" : output;
            if (runTimedOut || runExit !== 0) {
                await progressMsg.edit({ content: `[2/2] Run ${runTimedOut ? "TIMEOUT" : "FAIL"}\n\`\`\`ansi\n${clippedOut}\n\`\`\`` });
            } else {
                await progressMsg.edit({ content: `\`\`\`ansi\n${clippedOut}\n\`\`\`` });
            }

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
