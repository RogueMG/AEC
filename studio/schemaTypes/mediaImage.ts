import { defineField, defineType } from "sanity";

type MediaImageValue = { upload?: { asset?: unknown }; url?: string } | undefined;

// An image that is either uploaded to Sanity or linked from elsewhere.
export const mediaImage = defineType({
  name: "mediaImage",
  title: "Image",
  type: "object",
  fields: [
    defineField({
      name: "upload",
      title: "Upload",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "url",
      title: "Or paste an image link",
      type: "url",
      description: "Use instead of an upload, for example a manufacturer's product image.",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description:
        "Describe what the image shows. Read out by screen readers and used by search engines.",
      validation: (rule) => rule.required().warning("Add a short description of the image."),
    }),
  ],
  validation: (rule) =>
    rule.custom((value: MediaImageValue) =>
      !value || value.upload?.asset || value.url ? true : "Upload an image or paste an image link.",
    ),
  preview: {
    select: { media: "upload", alt: "alt", url: "url" },
    prepare: ({ media, alt, url }) => ({
      title: alt || "Image",
      subtitle: media ? "Uploaded" : url,
      media,
    }),
  },
});
