import { defineCliConfig } from "sanity/cli";
import project from "../sanity.project.json";

export default defineCliConfig({
  api: { projectId: project.projectId, dataset: project.dataset },
  // Served from the site's GitHub Pages deployment at /AEC/studio/.
  project: { basePath: "/AEC/studio" },
  deployment: { autoUpdates: false },
});
