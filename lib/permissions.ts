// Role-based permission system
export type UserRole =
  | "ADMIN"
  | "GATEKEEPER"
  | "PROJECT_LEAD"
  | "RESEARCHER"
  | "REVIEWER"
  | "USER"
  | "CUSTOM";

export interface Permission {
  // User Management
  canManageUsers: boolean;
  canChangeUserRoles: boolean;
  canDeleteUsers: boolean;
  canViewAllUsers: boolean;

  // Project Management
  canCreateProjects: boolean;
  canDeleteProjects: boolean;
  canManageAllProjects: boolean;
  canAssignReviewers: boolean;

  // Review Management
  canConductReviews: boolean;
  canViewAllReviews: boolean;
  canExportReviews: boolean;
  canManageReviewSessions: boolean;

  // System Administration
  canAccessAdminPanel: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canManageTemplates: boolean;

  // Data Export
  canExportData: boolean;
  canViewReports: boolean;

  // Red Flags
  canRaiseRedFlags: boolean;
  canResolveRedFlags: boolean;
  canViewAllRedFlags: boolean;

  // Budget Management
  canManageBudgets: boolean;
  canApproveBudgets: boolean;
  canViewBudgets: boolean;
  canApproveExpenses: boolean;
}

// Define permissions for each role
const rolePermissions: Record<UserRole, Permission> = {
  ADMIN: {
    // User Management
    canManageUsers: true,
    canChangeUserRoles: true,
    canDeleteUsers: true,
    canViewAllUsers: true,

    // Project Management
    canCreateProjects: true,
    canDeleteProjects: true,
    canManageAllProjects: true,
    canAssignReviewers: true,

    // Review Management
    canConductReviews: true,
    canViewAllReviews: true,
    canExportReviews: true,
    canManageReviewSessions: true,

    // System Administration
    canAccessAdminPanel: true,
    canManageSettings: true,
    canViewAnalytics: true,
    canManageTemplates: true,

    // Data Export
    canExportData: true,
    canViewReports: true,

    // Red Flags
    canRaiseRedFlags: true,
    canResolveRedFlags: true,
    canViewAllRedFlags: true,

    // Budget Management
    canManageBudgets: true,
    canApproveBudgets: true,
    canViewBudgets: true,
    canApproveExpenses: true,
  },

  GATEKEEPER: {
    // User Management
    canManageUsers: false,
    canChangeUserRoles: false,
    canDeleteUsers: false,
    canViewAllUsers: true,

    // Project Management
    canCreateProjects: false,
    canDeleteProjects: false,
    canManageAllProjects: false,
    canAssignReviewers: true,

    // Review Management
    canConductReviews: true,
    canViewAllReviews: true,
    canExportReviews: true,
    canManageReviewSessions: true,

    // System Administration
    canAccessAdminPanel: false,
    canManageSettings: false,
    canViewAnalytics: true,
    canManageTemplates: false,

    // Data Export
    canExportData: true,
    canViewReports: true,

    // Red Flags
    canRaiseRedFlags: true,
    canResolveRedFlags: true,
    canViewAllRedFlags: true,

    // Budget Management
    canManageBudgets: false,
    canApproveBudgets: true,
    canViewBudgets: true,
    canApproveExpenses: true,
  },

  PROJECT_LEAD: {
    // User Management
    canManageUsers: false,
    canChangeUserRoles: false,
    canDeleteUsers: false,
    canViewAllUsers: false,

    // Project Management
    canCreateProjects: true,
    canDeleteProjects: false, // Only their own projects
    canManageAllProjects: false,
    canAssignReviewers: false,

    // Review Management
    canConductReviews: false,
    canViewAllReviews: false,
    canExportReviews: true,
    canManageReviewSessions: false,

    // System Administration
    canAccessAdminPanel: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canManageTemplates: false,

    // Data Export
    canExportData: true,
    canViewReports: false,

    // Red Flags
    canRaiseRedFlags: true,
    canResolveRedFlags: false,
    canViewAllRedFlags: false,

    // Budget Management
    canManageBudgets: true,
    canApproveBudgets: false,
    canViewBudgets: true,
    canApproveExpenses: false,
  },

  RESEARCHER: {
    // User Management
    canManageUsers: false,
    canChangeUserRoles: false,
    canDeleteUsers: false,
    canViewAllUsers: false,

    // Project Management
    canCreateProjects: false,
    canDeleteProjects: false,
    canManageAllProjects: false,
    canAssignReviewers: false,

    // Review Management
    canConductReviews: false,
    canViewAllReviews: false,
    canExportReviews: false,
    canManageReviewSessions: false,

    // System Administration
    canAccessAdminPanel: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canManageTemplates: false,

    // Data Export
    canExportData: false,
    canViewReports: false,

    // Red Flags
    canRaiseRedFlags: true,
    canResolveRedFlags: false,
    canViewAllRedFlags: false,

    // Budget Management
    canManageBudgets: false,
    canApproveBudgets: false,
    canViewBudgets: false,
    canApproveExpenses: false,
  },

  REVIEWER: {
    // User Management
    canManageUsers: false,
    canChangeUserRoles: false,
    canDeleteUsers: false,
    canViewAllUsers: false,

    // Project Management
    canCreateProjects: false,
    canDeleteProjects: false,
    canManageAllProjects: false,
    canAssignReviewers: false,

    // Review Management
    canConductReviews: true,
    canViewAllReviews: false,
    canExportReviews: false,
    canManageReviewSessions: false,

    // System Administration
    canAccessAdminPanel: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canManageTemplates: false,

    // Data Export
    canExportData: false,
    canViewReports: false,

    // Red Flags
    canRaiseRedFlags: true,
    canResolveRedFlags: false,
    canViewAllRedFlags: false,

    // Budget Management
    canManageBudgets: false,
    canApproveBudgets: false,
    canViewBudgets: false,
    canApproveExpenses: false,
  },

  USER: {
    // User Management
    canManageUsers: false,
    canChangeUserRoles: false,
    canDeleteUsers: false,
    canViewAllUsers: false,

    // Project Management
    canCreateProjects: false,
    canDeleteProjects: false,
    canManageAllProjects: false,
    canAssignReviewers: false,

    // Review Management
    canConductReviews: false,
    canViewAllReviews: false,
    canExportReviews: false,
    canManageReviewSessions: false,

    // System Administration
    canAccessAdminPanel: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canManageTemplates: false,

    // Data Export
    canExportData: false,
    canViewReports: false,

    // Red Flags
    canRaiseRedFlags: false,
    canResolveRedFlags: false,
    canViewAllRedFlags: false,

    // Budget Management
    canManageBudgets: false,
    canApproveBudgets: false,
    canViewBudgets: false,
    canApproveExpenses: false,
  },

  CUSTOM: {
    // Custom roles will have permissions defined separately
    // Default to minimal permissions
    canManageUsers: false,
    canChangeUserRoles: false,
    canDeleteUsers: false,
    canViewAllUsers: false,
    canCreateProjects: false,
    canDeleteProjects: false,
    canManageAllProjects: false,
    canAssignReviewers: false,
    canConductReviews: false,
    canViewAllReviews: false,
    canExportReviews: false,
    canManageReviewSessions: false,
    canAccessAdminPanel: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canManageTemplates: false,
    canExportData: false,
    canViewReports: false,
    canRaiseRedFlags: false,
    canResolveRedFlags: false,
    canViewAllRedFlags: false,

    // Budget Management
    canManageBudgets: false,
    canApproveBudgets: false,
    canViewBudgets: false,
    canApproveExpenses: false,
  },
};

/**
 * Get permissions for a user role
 */
export function getPermissions(role: UserRole): Permission {
  return rolePermissions[role] || rolePermissions.USER;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: keyof Permission
): boolean {
  const permissions = getPermissions(userRole);
  return permissions[permission];
}

/**
 * Check if a user can manage other users (change roles, delete, etc.)
 */
export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, "canManageUsers");
}

/**
 * Check if a user can change roles of other users
 */
export function canChangeUserRoles(userRole: UserRole): boolean {
  return hasPermission(userRole, "canChangeUserRoles");
}

/**
 * Check if a user can access admin features
 */
export function canAccessAdmin(userRole: UserRole): boolean {
  return hasPermission(userRole, "canAccessAdminPanel");
}

/**
 * Check if a user can export data
 */
export function canExportData(userRole: UserRole): boolean {
  return hasPermission(userRole, "canExportData");
}

/**
 * Check if a user can conduct reviews
 */
export function canConductReviews(userRole: UserRole): boolean {
  return hasPermission(userRole, "canConductReviews");
}

/**
 * Check if a user can manage projects
 */
export function canManageProjects(userRole: UserRole): boolean {
  return (
    hasPermission(userRole, "canManageAllProjects") ||
    hasPermission(userRole, "canCreateProjects")
  );
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    ADMIN: "Administrator",
    GATEKEEPER: "Gatekeeper",
    PROJECT_LEAD: "Project Lead",
    RESEARCHER: "Researcher",
    REVIEWER: "Reviewer",
    USER: "User",
    CUSTOM: "Custom Role",
  };

  return roleNames[role] || "Unknown Role";
}

/**
 * Get available roles that a user can assign to others
 */
export function getAssignableRoles(currentUserRole: UserRole): UserRole[] {
  if (currentUserRole === "ADMIN") {
    return ["USER", "RESEARCHER", "REVIEWER", "PROJECT_LEAD", "GATEKEEPER"];
  }

  // Only admins can assign roles
  return [];
}

/**
 * Check if user can change their own profile (but not role)
 */
export function canEditOwnProfile(): boolean {
  return true; // All users can edit their own profile (except role)
}

/**
 * Check if a user can view a specific feature based on their role
 */
export function canViewFeature(
  userRole: UserRole,
  feature:
    | "admin"
    | "analytics"
    | "user-management"
    | "export"
    | "reviews"
    | "budget"
): boolean {
  switch (feature) {
    case "admin":
      return canAccessAdmin(userRole);
    case "analytics":
      return hasPermission(userRole, "canViewAnalytics");
    case "user-management":
      return canManageUsers(userRole);
    case "export":
      return canExportData(userRole);
    case "reviews":
      return (
        canConductReviews(userRole) ||
        hasPermission(userRole, "canViewAllReviews")
      );
    case "budget":
      return canManageBudgets(userRole);
    default:
      return false;
  }
}

/**
 * Check if a user can manage budgets
 */
export function canManageBudgets(userRole: UserRole): boolean {
  return (
    hasPermission(userRole, "canManageBudgets") ||
    hasPermission(userRole, "canApproveBudgets")
  );
}

/**
 * Check if a user can access budget features (including project leads)
 */
export function canAccessBudgets(userRole: UserRole): boolean {
  return (
    hasPermission(userRole, "canManageBudgets") ||
    hasPermission(userRole, "canApproveBudgets") ||
    hasPermission(userRole, "canViewBudgets") ||
    userRole === "PROJECT_LEAD"
  );
}

/**
 * Check if a user can approve budgets
 */
export function canApproveBudgets(userRole: UserRole): boolean {
  return hasPermission(userRole, "canApproveBudgets");
}

/**
 * Check if a user can view budgets
 */
export function canViewBudgets(userRole: UserRole): boolean {
  return hasPermission(userRole, "canViewBudgets");
}

/**
 * Check permissions for a specific user by ID
 */
export async function checkPermissions(
  userId: string,
  permission: string
): Promise<boolean> {
  // This is a placeholder - in a real implementation, you'd fetch the user's role
  // and check their permissions. For now, we'll return true for basic permissions.
  const basicPermissions = [
    "EXPORT_ACTIVITIES",
    "VIEW_ACTIVITIES",
    "EXPORT_ANALYTICS",
    "APPROVE_BUDGET",
    "MANAGE_BUDGET",
    "VIEW_BUDGET",
    "APPROVE_EXPENSES",
  ];

  return basicPermissions.includes(permission);
}
