import { defineField, defineType } from "sanity";

export const brand = defineType({
  name: "brand",
  title: "Brand",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 64 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "inHouse",
      title: "Our own products",
      type: "boolean",
      description:
        "Turn on for Asiatic Engineering's in-house range. In-house is not listed among dealer brands.",
      initialValue: false,
    }),
    defineField({
      name: "logo",
      type: "mediaImage",
      description: "Optional. Without a logo the brand name is shown as text.",
    }),
    defineField({ name: "order", type: "number", initialValue: 100 }),
  ],
  orderings: [{ title: "Display order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name", inHouse: "inHouse", media: "logo.upload" },
    prepare: ({ title, inHouse, media }) => ({
      title,
      subtitle: inHouse ? "In-house" : "Dealer brand",
      media,
    }),
  },
});
