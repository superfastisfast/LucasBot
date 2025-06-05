// export enum Attribute {
//     strength = 1,
//     agility = 2,
//     charisma = 3,
//     magicka = 4,
//     stamina = 5,
//     defense = 6,
//     vitality = 7,
// }

// // enum StatModifierType {
// //     FLAT = 1,
// //     PERCENTAGE = 2,
// // }

// export class Item {
//     flatStatModifiers: Map<Attribute, number>;
//     percentageStatModifiers: Map<Attribute, number>;

//     name: string = "item";

//     constructor(name: string) {
//         this.name = name;
//         this.flatStatModifiers = new Map<Attribute, number>();
//         this.percentageStatModifiers = new Map<Attribute, number>();
//     }

//     addFlatStatModifier(stat: Attribute, value: number) {
//         this.flatStatModifiers.set(stat, value);
//     }
//     addPercentageStatModifier(stat: Attribute, value: number) {
//         this.percentageStatModifiers.set(stat, value);
//     }
// }
