import { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

export type SidebarSettingsGroup = {
  title: string;
  icon: LucideIcon;
  items: {
    title: string;
    url: string;
  }[];
};

export type SidebarAction = {
  title: string;
  url: string;
};

export type SidebarNavigation = {
  navMain: SidebarNavItem[];
  settings?: SidebarSettingsGroup;
  action?: SidebarAction;
};