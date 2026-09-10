import { projectBriefSchema, projectSpecSchema, siteContextSchema } from "@/types";
import { DEMO_ADDRESS, canonicalSiteContext } from "@/fixtures/site-context";
import { checkFeasibility } from "./feasibility";
import { visualSignature } from "./visual-signature";

/** Refresh only the fictional demo's context; retain the homeowner's edited scope and geometry. */
export function restoreProject(saved: {project:unknown;site:unknown;brief:unknown}) {
  let project=projectSpecSchema.parse(saved.project);
  let site=siteContextSchema.parse(saved.site);
  const brief=projectBriefSchema.parse(saved.brief);
  if(site.isDemo && site.id==="site-maple-demo" && project.siteContextId===site.id && project.propertyAddress===DEMO_ADDRESS) {
    site=structuredClone(canonicalSiteContext);
    project=checkFeasibility(project,site,false);
  }
  if(project.scene.specSignature!==visualSignature(project)) project.scene={units:"feet",camera:"perspective",renderer:"pending",renderUrl:null,blendFile:null};
  if(project.conceptVisual?.specSignature!==visualSignature(project)) delete project.conceptVisual;
  return {project,site,brief};
}
