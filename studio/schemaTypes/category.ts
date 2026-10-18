import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Used in the page address, e.g. /products/safety-ppe",
      options: { source: "title", maxLength: 64 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      type: "text",
      rows: 3,
      description: "One or two sentences shown on the home page tile and the category page.",
      validation: (rule) => rule.required().max(180),
    }),
    defineField({ name: "image", type: "mediaImage", validation: (rule) => rule.required() }),
    defineField({
      name: "tone",
      title: "Tile colour",
      type: "string",
      description: "Leave on Automatic to cycle coral, yellow, teal and navy in order.",
      initialValue: "auto",
      options: {
        layout: "radio",
        list: [
          { title: "Automatic", value: "auto" },
          { title: "Coral", value: "coral" },
          { title: "Yellow", value: "yellow" },
          { title: "Teal", value: "teal" },
          { title: "Navy", value: "navy" },
        ],
      },
    }),
    defineField({
      name: "showOnHome",
      title: "Show on home page",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "madeInHouse",
      title: "Made in-house",
      type: "boolean",
      description: "Shows the 'Made in-house' badge on the tile.",
      initialValue: false,
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Lower numbers come first.",
      initialValue: 100,
    }),
  ],
  orderings: [{ title: "Display order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "summary", media: "image.upload" } },
});
