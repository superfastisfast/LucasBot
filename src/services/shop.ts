import { Item, type ItemDocument } from "@/models/item";
import { Service } from "@/service";
import { Client } from "discord.js";

export default class ShopService extends Service.Base {
    static items: Array<ItemDocument> = [];
    override async start(client: Client): Promise<void> {}

    override async stop(client: Client): Promise<void> {}

    public static async getActiveShopItems(): Promise<Array<ItemDocument>> {
        if (this.items.length <= 0) {
            const newItems: Array<ItemDocument | null> = [
                //TODO: random gen the items
                await Item.getFromName("Club"),
                await Item.getFromName("Leather Helmet"),
                await Item.getFromName("Leather Chestplate"),
            ];
            this.items = newItems.filter((item) => item !== null && item !== undefined);
        }
        return this.items;
    }
}
