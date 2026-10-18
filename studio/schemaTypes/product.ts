import { defineArrayMember, defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  groups: [
    { name: "basics", title: "Basics", default: true },
    { name: "details", title: "Details" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "basics",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "basics",
      description: "Used in the page address, e.g. /products/safety-ppe/cotton-knitted-gloves",
      options: { source: "title", maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      group: "basics",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "brand",
      type: "reference",
      to: [{ type: "brand" }],
      group: "basics",
    }),
    defineField({
      name: "summary",
      type: "text",
      rows: 3,
      group: "basics",
      description: "One or two sentences shown on product cards and at the top of the product page.",
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      name: "images",
      type: "array",
      group: "basics",
      description: "The first image is the main one. Drag to reorder.",
      of: [defineArrayMember({ type: "mediaImage" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "keyFeatures",
      title: "Key features",
      type: "array",
      group: "details",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "description",
      type: "array",
      group: "details",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Paragraph", value: "normal" },
            { title: "Heading", value: "h3" },
          ],
          lists: [{ title: "Bullets", value: "bullet" }],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [],
          },
        }),
      ],
    }),
    defineField({
      name: "specifications",
      type: "array",
      group: "details",
      description: "Label and value rows, e.g. Material: Cotton, Standard: EN 388.",
      of: [
        defineArrayMember({
          type: "object",
          name: "spec",
          fields: [
            defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "value", type: "string", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "label", subtitle: "value" } },
        }),
      ],
    }),
    defineField({
      name: "variants",
      title: "Sizes / variants",
      type: "array",
      group: "details",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "order",
      type: "number",
      group: "basics",
      description: "Lower numbers come first within the category.",
      initialValue: 100,
    }),
    defineField({
      name: "isSample",
      title: "Sample listing",
      type: "boolean",
      group: "basics",
      description:
        "Shows a 'details to be confirmed' note on the product page. Turn off once the details are final.",
      initialValue: false,
    }),
  ],
  orderings: [{ title: "Display order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", category: "category.title", media: "images.0.upload" },
    prepare: ({ title, category, media }) => ({ title, subtitle: category, media }),
  },
});
