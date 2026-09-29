"use client";

import { Tags } from "lucide-react";
import { UserTagBadge } from "@/components/settings/user-tag-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserTags } from "@/lib/api/hooks/use-dashboards";

const ALL_TAGS = "__all_tags__";

export default function DashboardProfileFilter({
  tagId,
  onTagChange,
  description = "Filtre todas as métricas, escopos, clientes e serviços pelos usuários associados a uma tag.",
}: {
  tagId?: string;
  onTagChange: (tagId?: string) => void;
  description?: string;
}) {
  const { data: tags = [], isLoading } = useUserTags();
  const selectedTag = tags.find((tag) => tag.id === tagId);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Tags className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">Visão por perfil da equipe</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        {selectedTag ? <UserTagBadge tag={selectedTag} /> : null}
        <Select
          value={tagId || ALL_TAGS}
          onValueChange={(value) => onTagChange(value === ALL_TAGS ? undefined : value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Todos os perfis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TAGS}>Todos os perfis</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name} ({tag.users_count ?? 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
