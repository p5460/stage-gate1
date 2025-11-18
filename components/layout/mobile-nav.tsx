"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const getNavigation = (userRole: string) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: "fas fa-tachometer-alt" },
    { name: "Projects", href: "/projects", icon: "fas fa-project-diagram" },
    { name: "Gate Reviews", href: "/reviews", icon: "fas fa-clipboard-check" },
    {
      name: "Red Flags",
      href: "/red-flags",
      icon: "fas fa-exclamation-triangle",
    },
    { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
    { name: "Templates", href: "/templates", icon: "fas fa-file-alt" },
    { name: "Settings", href: "/settings", icon: "fas fa-cog" },
  ];

  // Add admin navigation for admin users
  if (userRole === "ADMIN") {
    baseNavigation.splice(-1, 0, {
      name: "Administration",
      href: "/admin",
      icon: "fas fa-shield-alt",
    });
  }

  // Add user management for gatekeepers and admins
  if (["ADMIN", "GATEKEEPER"].includes(userRole)) {
    baseNavigation.splice(-1, 0, {
      name: "User Management",
      href: "/admin/users",
      icon: "fas fa-users",
    });
  }

  return baseNavigation;
};

interface MobileNavProps {
  user?: any;
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileNav({ user, isOpen, onToggle }: MobileNavProps) {
  const pathname = usePathname();
  const navigation = getNavigation(user?.role || "USER");

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={onToggle}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-background h-full">
            {/* Mobile header */}
            <div className="flex items-center justify-between h-16 px-4 bg-background border-b border-border">
              <div className="flex items-center">
                <img src="/logo.png" alt="CSIR Logo" className="h-8" />
                <span className="ml-2 text-sm font-semibold text-foreground">
                  Stage-Gate
                </span>
              </div>
              <Button
                variant="ghost"
                onClick={onToggle}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>

            <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
              {/* User Profile in Mobile */}
              {user && (
                <div className="flex items-center p-2 mb-4 rounded-lg bg-muted">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.image || ""} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-foreground">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role?.replace("_", " ") || "User"}
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="flex-1 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onToggle}
                      className={cn(
                        "sidebar-item flex items-center px-2 py-3 text-sm font-medium text-foreground rounded-md hover:bg-accent transition-colors",
                        isActive &&
                          "active bg-blue-50 border-l-4 border-[#005b9f] text-[#005b9f]"
                      )}
                    >
                      <i
                        className={cn(
                          `${item.icon} mr-3`,
                          isActive ? "text-[#005b9f]" : "text-muted-foreground"
                        )}
                      ></i>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className="border-t border-border my-2"></div>

              {/* Theme Toggle */}
              <div className="mt-2">
                <div className="flex items-center justify-between px-2 py-2">
                  <span className="text-sm font-medium text-foreground">
                    Theme
                  </span>
                  <ThemeToggle />
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-2">
                <Link
                  href="/help"
                  onClick={onToggle}
                  className="flex items-center px-2 py-2 text-sm font-medium text-foreground rounded-md hover:bg-accent"
                >
                  <i className="fas fa-question-circle mr-3 text-blue-500"></i>
                  Help & Support
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
              <p>Version 1.0.0</p>
              <p>© 2025 CSIR. All rights reserved.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
