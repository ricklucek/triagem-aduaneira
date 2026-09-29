"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/lib/auth/session-storage";

const BulkEdit = () => {
  const session = useAuthSession();
  if (!session) return null;

  return (
    <Button type="button" variant="outline" asChild>
      <Link href="/scope/bulk-edit">
        <ListChecks className="size-4" />
        Alteração em massa
      </Link>
    </Button>
  );
};

export default BulkEdit;
