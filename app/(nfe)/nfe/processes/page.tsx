import { Suspense } from "react";
import { NfeProcessList } from "@/components/nfe/nfe-process-list";

export default function NfeProcessesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">
          Carregando processos…
        </div>
      }
    >
      <NfeProcessList />
    </Suspense>
  );
}
