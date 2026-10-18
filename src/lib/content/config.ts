import project from "../../../sanity.project.json";

// Content comes from Sanity once a projectId is set in sanity.project.json.
// Until then the site renders the local starter catalogue.
export const sanityConfig = {
  projectId: project.projectId,
  dataset: project.dataset,
  apiVersion: project.apiVersion,
};

export const cmsEnabled = sanityConfig.projectId.length > 0;
