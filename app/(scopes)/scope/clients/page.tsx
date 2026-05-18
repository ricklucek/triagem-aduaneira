'use client';

import { ScopeWorkspace } from '@/components/layout/scope-workspace';
import { Card } from '@/components/ui/card';

export default function ScopeClientsPage() {
  return (
    <ScopeWorkspace
      navigation={<p className="text-xs text-muted-foreground">Modo dividido habilitado</p>}
      content={
        <Card className="p-4">
          <h2 className="text-lg font-semibold">Clientes</h2>
          <p className="text-sm text-muted-foreground">Listagem de registros em painel lateral configurável.</p>
        </Card>
      }
      detail={
        <Card className="p-4">
          <h3 className="text-base font-semibold">Visualização</h3>
          <p className="text-sm text-muted-foreground">Ao selecionar um registro, a visualização detalhada pode ser renderizada nesta área.</p>
        </Card>
      }
    />
  );
}
