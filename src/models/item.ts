import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
    name: { type: String },
    cost: { type: Number },
    tag: { type: String },
    rarity: { type: Number },
    flatStatModifiers: {
        type: Map,
        of: Number,
    },
    percentageStatModifiers: {
        type: Map,
        of: Number,
    },
});

export interface ItemDocument {
    name: string;
    cost: number;
    tag: string;
    rarity: number;
    flatStatModifiers: Map<string, number>;
    percentageStatModifiers: Map<string, number>;
}

export type ItemModel = mongoose.InferSchemaType<typeof itemSchema>;
export const ItemModel = mongoose.model<ItemDocument>("Item", itemSchema);

export namespace Item {
    export async function getFromName(
        name: string,
    ): Promise<ItemDocument | null> {
        try {
            const item = await ItemModel.findOne({ name: name });
            return item;
            // return await client.users.fetch(id);
        } catch (error) {
            console.error(`Failed to fetch weapon with name ${name}:`, error);
            return null;
        }
    }

    export async function getRandom(): Promise<ItemDocument | null> {
        try {
            const randomItems = await ItemModel.aggregate<ItemDocument>([
                { $sample: { size: 1 } },
            ]);
            const item = randomItems.length > 0 ? randomItems[0]! : null;
            return item;
        } catch (error) {
            console.error(`Failed to fetch random item`, error);
            return null;
        }
    }

    // export function getAttributeFom(item: ItemDocument) {

    //     return { item.flatStatModifiers, item.percentageStatModifiers };
    // }

    export function getStringCollection(items: Array<ItemDocument>): string {
        const formattedItems = items
            .map((item) => {
                let itemDetails = `**${item.name}**`;
                const flatStatsParts: string[] = [];
                for (const [
                    statName,
                    amplifier,
                ] of item.flatStatModifiers.entries()) {
                    flatStatsParts.push(`${statName}: ${amplifier}`);
                }
                if (flatStatsParts.length > 0) {
                    itemDetails += `\n${flatStatsParts.join(", ")}`;
                }

                const percentageStatsParts: string[] = [];
                for (const [
                    statName,
                    amplifier,
                ] of item.percentageStatModifiers.entries()) {
                    percentageStatsParts.push(
                        `${statName}: ${(amplifier * 100).toFixed(0)}%`,
                    );
                }
                if (percentageStatsParts.length > 0) {
                    itemDetails += `\n${percentageStatsParts.join(", ")}`;
                }

                return itemDetails;
            })
            .join("\n");

        const itemsDisplay =
            formattedItems.length > 0 ? formattedItems : "None";

        return itemsDisplay;
    }
}
