"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return <aside className={cn("hidden w-72 flex-col border-r bg-background md:flex", className)} {...props} />;
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto p-4 pt-0", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto p-4", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function SidebarMenuButton({ className, isActive, ...props }: React.ComponentProps<"button"> & { isActive?: boolean }) {
  return <button className={cn("w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted", isActive && "bg-muted font-medium", className)} {...props} />;
}
