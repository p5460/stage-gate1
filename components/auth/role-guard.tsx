"use client";

import { ReactNode } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission, canViewFeature, UserRole } from "@/lib/permissions";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: keyof import("@/lib/permissions").Permission;
  feature?: "admin" | "analytics" | "user-management" | "export" | "reviews";
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL specified permissions
}

/**
 * Component that conditionally renders children based on user role and permissions
 */
export function RoleGuard({
  children,
  allowedRoles,
  requiredPermission,
  feature,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const user = useCurrentUser();

  if (!user) {
    return <>{fallback}</>;
  }

  const userRole = user.role as UserRole;
  let hasAccess = false;

  // Check by allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(userRole);
  }

  // Check by specific permission
  if (requiredPermission) {
    const permissionCheck = hasPermission(userRole, requiredPermission);
    hasAccess = requireAll
      ? hasAccess && permissionCheck
      : hasAccess || permissionCheck;
  }

  // Check by feature
  if (feature) {
    const featureCheck = canViewFeature(userRole, feature);
    hasAccess = requireAll
      ? hasAccess && featureCheck
      : hasAccess || featureCheck;
  }

  // If no specific checks are provided, default to true (show to all authenticated users)
  if (!allowedRoles && !requiredPermission && !feature) {
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook to check if current user has specific permissions
 */
export function usePermissions() {
  const user = useCurrentUser();

  const checkPermission = (
    permission: keyof import("@/lib/permissions").Permission
  ): boolean => {
    if (!user) return false;
    return hasPermission(user.role as UserRole, permission);
  };

  const checkFeature = (
    feature: "admin" | "analytics" | "user-management" | "export" | "reviews"
  ): boolean => {
    if (!user) return false;
    return canViewFeature(user.role as UserRole, feature);
  };

  const checkRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role as UserRole);
  };

  return {
    user,
    checkPermission,
    checkFeature,
    checkRole,
    canManageUsers: checkPermission("canManageUsers"),
    canChangeRoles: checkPermission("canChangeUserRoles"),
    canExportData: checkPermission("canExportData"),
    canAccessAdmin: checkFeature("admin"),
    canViewAnalytics: checkFeature("analytics"),
    canConductReviews: checkPermission("canConductReviews"),
  };
}

/**
 * Component specifically for admin-only content
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Component for gatekeeper and admin content
 */
export function GatekeeperOrAdmin({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["ADMIN", "GATEKEEPER"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Component for users who can manage projects
 */
export function ProjectManagerOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["ADMIN", "PROJECT_LEAD"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Component for users who can conduct reviews
 */
export function ReviewerOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard requiredPermission="canConductReviews" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Component for export functionality
 */
export function ExportOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard requiredPermission="canExportData" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
