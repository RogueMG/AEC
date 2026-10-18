import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import project from "../sanity.project.json";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

export default defineConfig({
  name: "aec",
  title: "Asiatic Engineering Co.",
  projectId: project.projectId,
  dataset: project.dataset,
  // No basePath here: the build mounts the Studio at project.basePath in sanity.cli.ts,
  // and a workspace basePath would be appended to it (/AEC/studio/AEC/studio).
  plugins: [
    structureTool({ structure }),
    // Vision lets the developer try GROQ queries against live content.
    visionTool({ defaultApiVersion: project.apiVersion }),
  ],
  schema: { types: schemaTypes },
});
