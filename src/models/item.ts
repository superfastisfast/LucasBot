import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
    name: { type: String },
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
    flatStatModifiers: Map<string, number>;
    percentageStatModifiers: Map<string, number>;
}

export type ItemModel = mongoose.InferSchemaType<typeof itemSchema>;
export const ItemModel = mongoose.model<ItemDocument>("Item", itemSchema);

export async function getWeaponFromName(
    name: string,
): Promise<ItemDocument | null> {
    try {
        const weapon = await ItemModel.findOne({ name: name });
        return weapon;
        // return await client.users.fetch(id);
    } catch (error) {
        console.error(`Failed to fetch weapon with name ${name}:`, error);
        return null;
    }
}

export async function getHelmetFromName(
    name: string,
): Promise<ItemDocument | null> {
    try {
        const Helmet = await ItemModel.findOne({ name: name });
        return Helmet;
        // return await client.users.fetch(id);
    } catch (error) {
        console.error(`Failed to fetch Helmet with name ${name}:`, error);
        return null;
    }
}
