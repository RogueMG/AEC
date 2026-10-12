export type CategoryTone = "coral" | "yellow" | "teal" | "navy";

export type ProductCategory = {
  id: string;
  name: string;
  summary: string;
  items: string[];
  image: string;
  imageAlt: string;
  tone: CategoryTone;
  madeInHouse?: boolean;
};

export const productCategories: ProductCategory[] = [
  {
    id: "safety-ppe",
    name: "Safety / PPE",
    summary: "Cotton knitted gloves made on our own floor, plus the protection that goes with them.",
    items: ["Cotton knitted industrial gloves", "PPE safety items", "Welding & safety consumables"],
    image: "images/cat-safety-ppe.jpg",
    imageAlt: "Yellow leather work gloves laid out on a workbench",
    tone: "coral",
    madeInHouse: true,
  },
  {
    id: "hardware-tools",
    name: "Hardware & Tools",
    summary: "Deburring and finishing tools for precision work, with the hardware to back them up.",
    items: ["Deburring blades & tools", "Abrasives", "Hardware consumables"],
    image: "images/cat-hardware-tools.jpg",
    imageAlt: "Steel spanners arranged on a workshop surface",
    tone: "yellow",
  },
  {
    id: "consumables",
    name: "Consumables",
    summary: "The lines that run out first, kept moving so your shop floor doesn't stop.",
    items: ["Spray paints"],
    image: "images/cat-consumables.jpg",
    imageAlt: "Spray paint cans seen from above",
    tone: "teal",
  },
  {
    id: "mro",
    name: "MRO",
    summary: "Maintenance, repair and operations supplies that keep plant and equipment running.",
    items: ["MRO products"],
    image: "images/cat-mro.jpg",
    imageAlt: "Tapered roller bearing on a bright surface",
    tone: "navy",
  },
];
