'use client';

import { ReactNode, useMemo, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ScopeWorkspaceProps = {
  navigation: ReactNode;
  content: ReactNode;
  detail: ReactNode;
  defaultListWidth?: number;
  className?: string;
};

export function ScopeWorkspace({
  navigation,
  content,
  detail,
  defaultListWidth = 38,
  className,
}: ScopeWorkspaceProps) {
  const isMobile = useIsMobile();
  const [showList, setShowList] = useState(true);
  const [showDetail, setShowDetail] = useState(true);

  const columns = useMemo(() => {
    const list = showList ? `${defaultListWidth}%` : '0px';
    const info = showDetail ? '1fr' : '0px';
    return `${list} ${info}`;
  }, [defaultListWidth, showDetail, showList]);

  if (isMobile) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
        <div className="border-b border-border/70 bg-card/50 p-2">{navigation}</div>
        <div className="animate-in fade-in slide-in-from-right-2 duration-300 overflow-auto p-4">
          {showDetail ? detail : content}
        </div>
        <div className="border-t border-border/70 bg-card/50 p-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDetail((current) => !current)}>
            {showDetail ? 'Voltar para lista' : 'Abrir visualização'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-1 overflow-hidden', className)}>
      <aside className="hidden w-12 shrink-0 border-r border-border/70 bg-card/50 md:flex md:flex-col md:items-center md:gap-2 md:py-2">
        <Button variant="ghost" size="icon" onClick={() => setShowList((current) => !current)}>
          {showList ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowDetail((current) => !current)}>
          {showDetail ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
        <div className="mt-3 w-full px-2">{navigation}</div>
      </aside>

      <div className="grid min-h-0 flex-1 transition-all duration-300 ease-in-out" style={{ gridTemplateColumns: columns }}>
        <section className={cn('min-h-0 overflow-auto border-r border-border/70 bg-card/20 transition-all duration-300', !showList && 'opacity-0')}>
          <div className="animate-in fade-in slide-in-from-left-2 duration-300 p-4">{content}</div>
        </section>
        <section className={cn('min-h-0 overflow-auto transition-all duration-300', !showDetail && 'opacity-0')}>
          <div className="animate-in fade-in slide-in-from-right-2 duration-300 p-4">{detail}</div>
        </section>
      </div>
    </div>
  );
}
