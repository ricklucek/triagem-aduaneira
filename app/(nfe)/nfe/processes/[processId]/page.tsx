import { NfeWorkflowOverview } from "@/components/nfe/nfe-workflow-overview";

export default async function NfeProcessPage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = await params;
  return <NfeWorkflowOverview processId={processId} />;
}
