"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Menu, User, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { GlobalSearch } from "@/components/search/global-search";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  user: any;
  notifications?: any[];
  unreadCount?: number;
}

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/reviews": "Gate Reviews",
  "/reports": "Reports",
  "/templates": "Templates",
  "/settings": "Settings",
  "/help": "Help & Support",
  "/admin": "Administration",
  "/admin/users": "User Management",
  "/admin/clusters": "Cluster Management",
  "/admin/roles": "Role Management",
};

export function Header({
  user,
  notifications = [],
  unreadCount = 0,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const currentPageName = pageNames[pathname] || "Dashboard";

  const handleProfileClick = () => {
    router.push("/settings?tab=profile");
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  return (
    <>
      <div className="flex items-center justify-between h-16 px-4 bg-background border-b border-border">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="mr-2 text-muted-foreground md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {currentPageName}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
          />

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-3 hover:bg-accent h-auto py-2 px-3"
              >
                <div className="hidden sm:flex sm:flex-col sm:items-end sm:text-right sm:min-w-0">
                  <span className="text-sm font-medium text-foreground truncate max-w-32">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize truncate max-w-32">
                    {user?.role?.replace("_", " ") || "User"}
                  </span>
                </div>
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage
                    src={user?.image || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="bg-blue-500 text-white font-medium">
                    {user?.name?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {user?.role?.replace("_", " ") || "User"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleProfileClick}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSettingsClick}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <LogoutButton>Sign out</LogoutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <MobileNav
        user={user}
        isOpen={mobileNavOpen}
        onToggle={() => setMobileNavOpen(!mobileNavOpen)}
      />
    </>
  );
}
