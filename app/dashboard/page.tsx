import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Rascunhos</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">3</CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Publicados</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">12</CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Pendências</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">5</CardContent>
      </Card>
    </div>
  );
}