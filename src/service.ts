import type { Client } from "discord.js";

export namespace Service {
    export abstract class Abstract {
        public async start(client: Client): Promise<void> {}
        public async stop(client: Client): Promise<void> {}
    }

    export const services: Abstract[] = [];

    export async function load(client: Client) {
        const glob = new Bun.Glob("./src/services/*.ts");
        console.log(`Loaded services:`);

        for (const path of glob.scanSync(".")) {
            const { default: ServiceClass } = await import(
                path.replace("./src/", "./")
            );
            const instance: Abstract = new ServiceClass();
            services.push(instance);
            console.log(`\t${instance.constructor.name}`);
        }
    }

    export async function start(client: Client) {
        for (const service of services) {
            await service.start(client);
        }
    }

    export async function stop(client: Client) {
        for (const service of services) {
            await service.stop(client);
        }
    }
}