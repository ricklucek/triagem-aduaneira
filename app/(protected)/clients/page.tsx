import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockClients = [
  { cnpj: "56091724000142", razao: "Vexos", status: "draft", lastVersion: 1 },
  {
    cnpj: "12345678000190",
    razao: "Via Importadora",
    status: "published",
    lastVersion: 3,
  },
];

export default function ClientsPage() {
  return (
    <Card className="rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Clientes</div>
          <div className="text-sm text-muted-foreground">
            CNPJ como chave única • Lista mockada
          </div>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/clients/123/scopes/new">Novo cliente</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Razão Social</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Última versão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockClients.map((c) => (
            <TableRow key={c.cnpj} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link
                  href={`/clients/${c.cnpj}/scopes`}
                  className="hover:underline"
                >
                  {c.razao}
                </Link>
              </TableCell>
              <TableCell>{c.cnpj}</TableCell>
              <TableCell>{c.status}</TableCell>
              <TableCell className="text-right">v{c.lastVersion}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
