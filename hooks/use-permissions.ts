"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  getPermissions,
  hasPermission as checkPermission,
  type Permission,
  type UserRole,
} from "@/lib/permissions";

export function usePermissions() {
  const { data: session } = useSession();

  const permissions = useMemo(() => {
    if (!session?.user?.role) return getPermissions("USER");
    return getPermissions(session.user.role as UserRole);
  }, [session]);

  const hasPermission = (permission: keyof Permission): boolean => {
    return permissions[permission];
  };

  const hasAnyPermission = (permissionList: (keyof Permission)[]): boolean => {
    return permissionList.some((permission) => permissions[permission]);
  };

  const hasAllPermissions = (permissionList: (keyof Permission)[]): boolean => {
    return permissionList.every((permission) => permissions[permission]);
  };

  const canCreateProject = hasPermission("canCreateProjects");
  const canEditProject = hasPermission("canManageAllProjects");
  const canDeleteProject = hasPermission("canDeleteProjects");
  const canManageProjectMembers = hasPermission("canManageAllProjects");

  const canConductGateReview = hasPermission("canConductReviews");
  const canApproveGate = hasPermission("canConductReviews");
  const canAssignReviewers = hasPermission("canAssignReviewers");

  const canUploadDocument = hasPermission("canCreateProjects");
  const canApproveDocument = hasPermission("canManageAllProjects");
  const canDeleteDocument = hasPermission("canManageAllProjects");
  const canManageTemplates = hasPermission("canManageTemplates");

  const canRaiseRedFlag = hasPermission("canRaiseRedFlags");
  const canResolveRedFlag = hasPermission("canResolveRedFlags");
  const canManageRedFlags = hasPermission("canViewAllRedFlags");

  const canCreateComment = true; // All users can create comments
  const canEditComment = true; // Users can edit their own comments
  const canDeleteComment = hasPermission("canManageAllProjects");
  const canModerateComments = hasPermission("canManageAllProjects");

  const canCreateMilestone = hasPermission("canCreateProjects");
  const canEditMilestone = hasPermission("canManageAllProjects");
  const canDeleteMilestone = hasPermission("canManageAllProjects");

  const canManageUsers = hasPermission("canManageUsers");
  const canAssignRoles = hasPermission("canChangeUserRoles");
  const canManageCustomRoles = hasPermission("canManageUsers");

  const canManageClusters = hasPermission("canAccessAdminPanel");
  const canViewAnalytics = hasPermission("canViewAnalytics");
  const canExportData = hasPermission("canExportData");
  const canManageSettings = hasPermission("canManageSettings");

  const canSendNotifications = hasPermission("canManageSettings");
  const canManageNotifications = hasPermission("canManageSettings");

  const isAdmin = session?.user?.role === "ADMIN";
  const isGatekeeper = session?.user?.role === "GATEKEEPER";
  const isProjectLead = session?.user?.role === "PROJECT_LEAD";
  const isResearcher = session?.user?.role === "RESEARCHER";
  const isReviewer = session?.user?.role === "REVIEWER";
  const isCustomRole = session?.user?.role === "CUSTOM";

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Project permissions
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canManageProjectMembers,

    // Gate review permissions
    canConductGateReview,
    canApproveGate,
    canAssignReviewers,

    // Document permissions
    canUploadDocument,
    canApproveDocument,
    canDeleteDocument,
    canManageTemplates,

    // Red flag permissions
    canRaiseRedFlag,
    canResolveRedFlag,
    canManageRedFlags,

    // Comment permissions
    canCreateComment,
    canEditComment,
    canDeleteComment,
    canModerateComments,

    // Milestone permissions
    canCreateMilestone,
    canEditMilestone,
    canDeleteMilestone,

    // User management permissions
    canManageUsers,
    canAssignRoles,
    canManageCustomRoles,

    // System permissions
    canManageClusters,
    canViewAnalytics,
    canExportData,
    canManageSettings,

    // Notification permissions
    canSendNotifications,
    canManageNotifications,

    // Role checks
    isAdmin,
    isGatekeeper,
    isProjectLead,
    isResearcher,
    isReviewer,
    isCustomRole,

    // User info
    user: session?.user,
    userRole: session?.user?.role,
    customRole: session?.user?.customRole,
  };
}

export function useProjectPermissions(
  isProjectLead?: boolean,
  isProjectMember?: boolean
) {
  const { hasPermission, isAdmin, isGatekeeper } = usePermissions();

  const canViewProject = useMemo(() => {
    if (isAdmin || isGatekeeper) return true;
    if (isProjectLead || isProjectMember) return true;
    return true; // All users can view projects they have access to
  }, [isAdmin, isGatekeeper, isProjectLead, isProjectMember]);

  const canEditProject = useMemo(() => {
    if (isAdmin) return true;
    if (isProjectLead) return true;
    return hasPermission("canManageAllProjects");
  }, [isAdmin, isProjectLead, hasPermission]);

  const canDeleteProject = useMemo(() => {
    if (isAdmin) return true;
    return hasPermission("canDeleteProjects");
  }, [isAdmin, hasPermission]);

  const canManageMembers = useMemo(() => {
    if (isAdmin || isGatekeeper) return true;
    if (isProjectLead) return true;
    return hasPermission("canManageAllProjects");
  }, [isAdmin, isGatekeeper, isProjectLead, hasPermission]);

  return {
    canViewProject,
    canEditProject,
    canDeleteProject,
    canManageMembers,
  };
}
