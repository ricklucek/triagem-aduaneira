import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import UserMenu from "../user/userMenu";
import NotificationsPanel from "../user/NotificationsPanel";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardHeader({
  headerText,
}: {
  headerText: string;
}) {
  return (
    <header className="flex h-16 shrink-0 z-10 items-center gap-2 transition-[height] ease-linear">
      <div
        className="
                fixed w-full z-10
                h-16 flex items-center justify-between px-4
                border-b border-border bg-background/90 text-foreground shadow-sm
                backdrop-blur supports-backdrop-filter:bg-background/75
                "
      >
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="min-w-0">
            <span className="text-lg font-semibold text-foreground sm:text-2xl">
              {headerText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationsPanel />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
