"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import ClientScopes from "@/components/layout/scopes/viewClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClientApi } from "@/lib/api/types/client-api";
import ClientsPage from "@/components/layout/scopes/listClient";

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
  const [selectedClient, setSelectedClient] = useState<ClientApi | null>(null);

  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  if (isDesktop === null) {
    return null;
  }

  if (!isDesktop) {
    return (
      <main className="w-full h-screen">
        <ClientsPage
          onSelectClient={(client) => {
            router.push(`/scope/clients/${client.id}`);
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
          <ClientsPage
            selectedClientId={selectedClient?.cnpj}
            onSelectClient={setSelectedClient}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={32} minSize={25}>
          <AnimatePresence mode="wait">
            {!selectedClient ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex h-full items-center justify-center p-6 text-center"
              >
                <span className="font-semibold text-muted-foreground">
                  Selecione um cliente para abrir
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={selectedClient.id}
                initial={{ opacity: 0, x: 32, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full overflow-auto"
              >
                <ClientScopes
                  clientId={selectedClient.id}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}