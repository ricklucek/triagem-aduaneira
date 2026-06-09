import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ToolsAccessSettingsPage() {
  return (
    <main className="w-full min-h-screen p-6">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Acesso as ferramentas</CardTitle>
          <CardDescription>
            Habilite os acessos dos seus usuários nas ferramentas disponíveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A configuração de permissões por ferramenta será exibida nesta seção.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
