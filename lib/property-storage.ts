import type { SiteContext } from "@/types";
/** Provider imagery and credentials are never persisted to browser project storage. */
export function siteForStorage(site:SiteContext):SiteContext {
 const copy=structuredClone(site);delete copy.propertyContext;return copy;
}
