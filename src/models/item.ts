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
    } catch (error) {
        console.error(`Failed to fetch weapon with name ${name}:`, error);
        return null;
    }
}
