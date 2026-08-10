"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export type ScopeViewTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export function ScopeViewTabs({ tabs }: { tabs: ScopeViewTab[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTab = searchParams.get("tab");
  const activeTab = tabs.some((tab) => tab.id === requestedTab)
    ? requestedTab
    : tabs[0]?.id;

  function selectTab(tabId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="grid gap-5">
      <div className="sticky top-16 z-10 -mx-4 border-y border-border bg-background/95 px-4 py-3 backdrop-blur print:hidden md:static md:mx-0 md:rounded-xl md:border">
        <div
          role="tablist"
          aria-label="Seções do escopo"
          className="flex min-w-max gap-2 overflow-x-auto pb-1 md:min-w-0 md:flex-wrap md:overflow-visible md:pb-0"
        >
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`scope-tab-panel-${tab.id}`}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-action bg-action text-action-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => selectTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((tab) => (
        <section
          key={tab.id}
          id={`scope-tab-panel-${tab.id}`}
          role="tabpanel"
          aria-label={tab.label}
          className={cn(
            "grid gap-4 print:block",
            tab.id !== activeTab && "hidden print:block",
          )}
        >
          <h3 className="mb-3 hidden text-lg font-semibold print:block">
            {tab.label}
          </h3>
          {tab.content}
        </section>
      ))}
    </div>
  );
}
