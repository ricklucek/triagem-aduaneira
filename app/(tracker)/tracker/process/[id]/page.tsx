import { ProcessDetailPage } from "@/components/tracker/process-detail-page";

export default async function TrackerProcessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProcessDetailPage processId={id} />;
}
