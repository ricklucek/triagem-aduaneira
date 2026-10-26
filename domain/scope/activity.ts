import type { ListScopesParams, ScopeActivity } from "@/data/scope/ScopeRepo";

export function scopeActivityFilters(
  activity: ScopeActivity,
  includeDrafts: boolean,
): Pick<ListScopesParams, "activity" | "status" | "include_drafts"> {
  return {
    activity,
    status:
      activity === "inactive"
        ? "archived"
        : activity === "active" && !includeDrafts
          ? "published"
          : undefined,
    include_drafts:
      activity === "all" || (activity === "active" && includeDrafts),
  };
}
