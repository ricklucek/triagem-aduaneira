"use client";

import { useParams } from "next/navigation";

import ViewScope from "@/components/layout/scopes/viewScope";

export default function ScopeViewPage() {
  const { id } = useParams<{ id: string }>();

  return <ViewScope id={id} />
}