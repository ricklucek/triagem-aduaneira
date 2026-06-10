import TrackerScopeWizard from "@/components/tracker/TrackerScopeWizard";
import { Suspense } from "react";

export default function NewTrackerProcessPage() {
  return (
    <Suspense>
      <TrackerScopeWizard />
    </Suspense>
  );
}
