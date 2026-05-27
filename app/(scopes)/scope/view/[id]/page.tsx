"use client";

import ScopeViewLayout from "@/components/layout/scopes/viewScope";
import { useParams } from "next/navigation";

export default function ScopeViewPage() {
  const { id } = useParams<{ id: string }>();

  return <ScopeViewLayout id={id} />;
}
