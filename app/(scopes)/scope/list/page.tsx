"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ListTable from "@/components/layout/scopes/listTable";
import ScopeViewPage from "@/components/layout/scopes/viewScope";
import { ScopeSummary } from "@/data/scope/ScopeRepo";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(query);

    const update = () => setMatches(media.matches);
    update();

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export default function DashboardPage() {
  const [selectedScope, setSelectedScope] = useState<ScopeSummary | null>(null);

  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  if (isDesktop === null) {
    return null;
  }

  if (!isDesktop) {
    return (
      <main className="w-full">
        <ListTable
          onSelectScope={(scope) => {
            router.push(`/scope/view/${scope.id}`);
          }}
        />
      </main>
    );
  }

  return (
    <main className="w-full h-screen">
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-[calc(100vh-120px)] rounded-lg border"
      >
        <ResizablePanel defaultSize={68} minSize={45}>
          <ListTable
            selectedScopeId={selectedScope?.id}
            onSelectScope={setSelectedScope}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={32} minSize={25}>
          <AnimatePresence mode="wait">
            {!selectedScope ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex h-full items-center justify-center p-6 text-center"
              >
                <span className="font-semibold text-muted-foreground">
                  Selecione um escopo para abrir
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={selectedScope.id}
                initial={{ opacity: 0, x: 32, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full overflow-auto"
              >
                <ScopeViewPage
                  id={selectedScope.id}
                  cnpj={selectedScope.client_cnpj ?? ""}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}