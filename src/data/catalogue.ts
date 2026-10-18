// Starter catalogue, written in a neutral authoring format.
// - The site renders it when no Sanity project is configured (see src/lib/content/local.ts).
// - scripts/build-seed.ts turns it into sanity/seed.ndjson for a one-off import into Sanity.
// Products are the FSD's product lines, marked as samples until the client supplies details.
// Image paths are relative to /public.

export type SeedImage = { src: string; alt: string };

export type SeedCategory = {
  slug: string;
  title: string;
  summary: string;
  image: SeedImage;
  tone: "auto" | "coral" | "yellow" | "teal" | "navy";
  showOnHome: boolean;
  madeInHouse: boolean;
  order: number;
};

export type SeedBrand = { slug: string; name: string; inHouse: boolean; order: number };

export type SeedProduct = {
  slug: string;
  title: string;
  category: string;
  brand?: string;
  summary: string;
  images: SeedImage[];
  keyFeatures: string[];
  description: string[];
  specifications: { label: string; value: string }[];
  variants: string[];
  order: number;
  isSample: boolean;
};

const img = {
  ppe: { src: "images/cat-safety-ppe.jpg", alt: "Yellow leather work gloves laid out on a workbench" },
  tools: { src: "images/cat-hardware-tools.jpg", alt: "Steel spanners arranged on a workshop surface" },
  paints: { src: "images/cat-consumables.jpg", alt: "Spray paint cans seen from above" },
  mro: { src: "images/cat-mro.jpg", alt: "Tapered roller bearing on a bright surface" },
  welding: { src: "images/hero-sparks.jpg", alt: "Sparks flying from metal being ground" },
  floor: { src: "images/about-floor.jpg", alt: "Workers at an assembly line on a factory floor" },
  workshop: { src: "images/catalogue-workshop.jpg", alt: "Machinist at work in a busy workshop" },
} satisfies Record<string, SeedImage>;

export const seedCategories: SeedCategory[] = [
  {
    slug: "safety-ppe",
    title: "Safety / PPE",
    summary: "Cotton knitted gloves made on our own floor, plus the protection that goes with them.",
    image: img.ppe,
    tone: "auto",
    showOnHome: true,
    madeInHouse: true,
    order: 10,
  },
  {
    slug: "hardware-tools",
    title: "Hardware & Tools",
    summary: "Deburring and finishing tools for precision work, with the hardware to back them up.",
    image: img.tools,
    tone: "auto",
    showOnHome: true,
    madeInHouse: false,
    order: 20,
  },
  {
    slug: "consumables",
    title: "Consumables",
    summary: "The lines that run out first, kept moving so your shop floor doesn't stop.",
    image: img.paints,
    tone: "auto",
    showOnHome: true,
    madeInHouse: false,
    order: 30,
  },
  {
    slug: "mro",
    title: "MRO",
    summary: "Maintenance, repair and operations supplies that keep plant and equipment running.",
    image: img.mro,
    tone: "auto",
    showOnHome: true,
    madeInHouse: false,
    order: 40,
  },
];

// Dealer brands in display order. The hero names the first three, so keep well-known names first.
export const seedBrands: SeedBrand[] = [
  { slug: "asiatic-engineering", name: "Asiatic Engineering", inHouse: true, order: 0 },
  { slug: "stanley", name: "Stanley", inHouse: false, order: 10 },
  { slug: "kobe", name: "Kobe", inHouse: false, order: 40 },
  { slug: "cp-grat-ex", name: "CP Grat-Ex", inHouse: false, order: 50 },
  { slug: "bestarc", name: "Bestarc", inHouse: false, order: 60 },
  { slug: "calguard", name: "Calguard", inHouse: false, order: 70 },
  { slug: "karam", name: "Karam", inHouse: false, order: 30 },
  { slug: "bosch", name: "Bosch", inHouse: false, order: 20 },
  { slug: "wesaf", name: "Wesaf", inHouse: false, order: 80 },
  { slug: "addison", name: "Addison", inHouse: false, order: 90 },
  { slug: "totem", name: "Totem", inHouse: false, order: 100 },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: "cotton-knitted-industrial-gloves",
    title: "Cotton knitted industrial gloves",
    category: "safety-ppe",
    brand: "asiatic-engineering",
    summary:
      "General-purpose knitted gloves made at our Sriperumbudur factory, for handling, assembly and light-duty work.",
    images: [img.ppe, img.floor],
    keyFeatures: [
      "Knitted in-house, so we control quality and lead times",
      "Seamless knit for comfort over a full shift",
      "Supplied in bulk for plant-wide use",
    ],
    description: [
      "Our cotton knitted gloves are made on our own floor in Sriperumbudur and supplied to manufacturers across South India.",
      "Tell us the application and the monthly quantity, and we will recommend the right weight and size mix.",
    ],
    specifications: [
      { label: "Made at", value: "Sriperumbudur, Tamil Nadu" },
      { label: "Material", value: "Cotton knit" },
      { label: "Supplied in", value: "Bulk packs" },
    ],
    variants: ["S", "M", "L", "XL"],
    order: 10,
    isSample: true,
  },
  {
    slug: "ppe-safety-items",
    title: "PPE safety items",
    category: "safety-ppe",
    summary:
      "Personal protective equipment for the shop floor: head, eye, hearing and hand protection from trusted brands.",
    images: [img.floor],
    keyFeatures: [
      "Sourced as an authorized dealer",
      "Mix and match for a full PPE kit per worker",
      "Bulk supply for plant-wide rollouts",
    ],
    description: [
      "We supply PPE alongside our own gloves, so a plant can source its full protection kit from one supplier.",
    ],
    specifications: [{ label: "Supplied as", value: "Authorized dealer" }],
    variants: [],
    order: 20,
    isSample: true,
  },
  {
    slug: "welding-safety-consumables",
    title: "Welding & safety consumables",
    category: "safety-ppe",
    summary: "Consumables and protection for welding bays, from electrodes to the gear that keeps welders safe.",
    images: [img.welding],
    keyFeatures: ["For fabrication and maintenance welding", "Stocked for repeat orders"],
    description: [
      "Welding consumables and welding-specific safety items, supplied for fabrication shops and plant maintenance teams.",
    ],
    specifications: [{ label: "Supplied as", value: "Authorized dealer" }],
    variants: [],
    order: 30,
    isSample: true,
  },
  {
    slug: "deburring-blades-tools",
    title: "Deburring blades & tools",
    category: "hardware-tools",
    summary: "Hand deburring tools and replacement blades for clean edges on machined and cast parts.",
    images: [img.tools, img.workshop],
    keyFeatures: [
      "For precision finishing of machined parts",
      "Replacement blades kept in stock",
      "Suits metal and plastic components",
    ],
    description: [
      "Deburring blades and handles for removing burrs after machining, drilling and casting, used across automobile and general manufacturing lines.",
    ],
    specifications: [{ label: "Use", value: "Precision finishing" }],
    variants: [],
    order: 10,
    isSample: true,
  },
  {
    slug: "abrasives",
    title: "Abrasives",
    category: "hardware-tools",
    summary: "Grinding, cutting and finishing abrasives for metalworking and fabrication.",
    images: [img.workshop],
    keyFeatures: ["For grinding, cutting and finishing", "Range of grits and sizes"],
    description: ["Abrasive discs and wheels for grinding, cutting and surface finishing."],
    specifications: [{ label: "Use", value: "Grinding, cutting, finishing" }],
    variants: [],
    order: 20,
    isSample: true,
  },
  {
    slug: "hardware-consumables",
    title: "Hardware consumables",
    category: "hardware-tools",
    summary: "Everyday hardware for workshops and maintenance teams, supplied in repeat quantities.",
    images: [img.tools],
    keyFeatures: ["Workshop and maintenance hardware", "Repeat supply for regular orders"],
    description: ["Hardware consumables for workshops, tool rooms and maintenance teams."],
    specifications: [{ label: "Supplied as", value: "Authorized dealer" }],
    variants: [],
    order: 30,
    isSample: true,
  },
  {
    slug: "spray-paints",
    title: "Spray paints",
    category: "consumables",
    summary: "Industrial spray paints for marking, touch-up and protective finishes.",
    images: [img.paints],
    keyFeatures: ["For marking, touch-up and finishing", "Wide colour range"],
    description: ["Spray paints for plant marking, equipment touch-up and protective coating jobs."],
    specifications: [{ label: "Use", value: "Marking, touch-up, finishing" }],
    variants: [],
    order: 10,
    isSample: true,
  },
  {
    slug: "mro-products",
    title: "MRO products",
    category: "mro",
    summary: "Maintenance, repair and operations supplies that keep plant and equipment running.",
    images: [img.mro],
    keyFeatures: ["For planned and breakdown maintenance", "One supplier for many MRO lines"],
    description: [
      "MRO supplies for maintenance teams, so plant and equipment stay running between shutdowns.",
    ],
    specifications: [{ label: "Use", value: "Maintenance, repair, operations" }],
    variants: [],
    order: 10,
    isSample: true,
  },
];
