"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardCheck,
  BarChart3,
  FileText,
  Settings,
  Users,
  Shield,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  canViewFeature,
  canAccessAdmin,
  canManageUsers,
  canManageBudgets,
  canAccessBudgets,
  hasPermission,
  UserRole,
} from "@/lib/permissions";

interface SidebarProps {
  user: any;
}

const getNavigation = (userRole: string) => {
  const role = userRole as UserRole;

  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderOpen },
  ];

  // Add navigation items based on permissions
  if (canViewFeature(role, "reviews")) {
    baseNavigation.push({
      name: "Gate Reviews",
      href: "/reviews",
      icon: ClipboardCheck,
    });
  }

  // Red flags - available to most users
  if (
    hasPermission(role, "canRaiseRedFlags") ||
    hasPermission(role, "canViewAllRedFlags")
  ) {
    baseNavigation.push({
      name: "Red Flags",
      href: "/red-flags",
      icon: AlertTriangle,
    });
  }

  // Reports - for users who can view reports
  if (
    hasPermission(role, "canViewReports") ||
    hasPermission(role, "canViewAnalytics")
  ) {
    baseNavigation.push({ name: "Reports", href: "/reports", icon: BarChart3 });
  }

  // Templates - for users who can manage templates or need to view them
  if (
    hasPermission(role, "canManageTemplates") ||
    role === "PROJECT_LEAD" ||
    role === "RESEARCHER"
  ) {
    baseNavigation.push({
      name: "Templates",
      href: "/templates",
      icon: FileText,
    });
  }

  // Admin navigation for admin users
  if (canAccessAdmin(role)) {
    baseNavigation.push({
      name: "Administration",
      href: "/admin",
      icon: Shield,
    });
  }

  // User management for users who can manage users
  if (canManageUsers(role)) {
    baseNavigation.push({
      name: "User Management",
      href: "/admin/users",
      icon: Users,
    });
  }

  // Analytics for users who can view analytics
  if (hasPermission(role, "canViewAnalytics")) {
    baseNavigation.push({
      name: "Analytics",
      href: "/admin/analytics",
      icon: TrendingUp,
    });
  }

  // Budget access for users who can manage budgets or are project leads
  if (canAccessBudgets(role)) {
    baseNavigation.push({
      name: canManageBudgets(role) ? "Budget Management" : "Budget",
      href: "/budget",
      icon: DollarSign,
    });
  }

  // Settings - available to all users
  baseNavigation.push({ name: "Settings", href: "/settings", icon: Settings });

  // Help & Support - available to all users
  baseNavigation.push({
    name: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  });

  return baseNavigation;
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const navigation = getNavigation(user?.role || "USER");

  return (
    <div className="flex flex-col w-64 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center">
          <img src="/logo.png" alt="CSIR Stage-Gate Logo" className="h-10" />
          <span className="ml-2 text-lg font-semibold text-sidebar-foreground">
            Stage-Gate
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
        {/* User Profile 
        <div className="flex items-center p-2 mb-4 rounded-lg bg-gray-50">
          <div className="flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback className="bg-blue-500 text-white">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role?.replace("_", " ") || "User"}
            </p>
          </div>
        </div>
*/}
        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const IconComponent = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "sidebar-item flex items-center px-2 py-3 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent transition-colors",
                  isActive &&
                    "active bg-sidebar-accent border-l-4 border-sidebar-primary text-sidebar-primary"
                )}
              >
                <IconComponent
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/60"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-xs text-sidebar-foreground/60 border-t border-sidebar-border">
        <p>Version 1.0.0</p>
        <p>© 2024 CSIR. All rights reserved.</p>
      </div>
    </div>
  );
}
