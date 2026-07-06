"use client";

import ClientScopes from "@/components/layout/scopes/viewClient";
import { useParams } from "next/navigation";


export default function ScopeViewPage() {
    const { id } = useParams<{ id: string }>();

    return (
        <main className="w-full h-screen">
            <ClientScopes clientId={id} />
        </main>
    );
}