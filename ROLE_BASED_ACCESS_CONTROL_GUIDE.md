# Role-Based Access Control (RBAC) System

## Overview

A comprehensive role-based access control system has been implemented to ensure users only have access to features and data appropriate for their role. This system prevents unauthorized access and maintains security throughout the application.

## 🔐 Security Improvements Implemented

### **1. Role Change Prevention**

- ✅ **Users cannot change their own roles**
- ✅ **Only administrators can modify user roles**
- ✅ **Role selection removed from user settings**
- ✅ **UI shows current role as read-only**

### **2. Permission-Based UI**

- ✅ **Navigation items shown based on permissions**
- ✅ **Action buttons hidden for unauthorized users**
- ✅ **Feature access controlled by role**
- ✅ **Graceful fallbacks for unauthorized access**

### **3. API Security**

- ✅ **Server-side permission checks**
- ✅ **Role validation on all sensitive operations**
- ✅ **Proper error messages for unauthorized access**
- ✅ **Activity logging for role changes**

## 👥 User Roles & Permissions

### **ADMIN (Administrator)**

**Full system access with all permissions:**

- ✅ Manage all users (create, delete, change roles)
- ✅ Access admin panel and system settings
- ✅ View all projects and reviews
- ✅ Export all data and view analytics
- ✅ Manage templates and system configuration
- ✅ Raise and resolve red flags
- ✅ Conduct reviews and assign reviewers

### **GATEKEEPER**

**Review and oversight responsibilities:**

- ✅ Conduct gate reviews
- ✅ View all reviews and export review data
- ✅ Assign reviewers to projects
- ✅ View analytics and reports
- ✅ Raise and resolve red flags
- ❌ Cannot manage users or change roles
- ❌ Cannot access admin panel

### **PROJECT_LEAD**

**Project management capabilities:**

- ✅ Create and manage their own projects
- ✅ Export project and review data
- ✅ Raise red flags on projects
- ✅ View project templates
- ❌ Cannot conduct reviews or assign reviewers
- ❌ Cannot manage users or access admin features
- ❌ Cannot view all projects (only their own)

### **REVIEWER**

**Review-specific permissions:**

- ✅ Conduct assigned gate reviews
- ✅ Raise red flags during reviews
- ✅ View assigned projects for review
- ❌ Cannot export data or view analytics
- ❌ Cannot manage projects or users
- ❌ Cannot view all reviews (only assigned ones)

### **RESEARCHER**

**Basic project participation:**

- ✅ Participate in assigned projects
- ✅ Raise red flags when necessary
- ✅ View project templates
- ❌ Cannot create or manage projects
- ❌ Cannot conduct reviews
- ❌ Cannot export data or access admin features

### **USER**

**Minimal access for basic users:**

- ✅ View dashboard and basic information
- ✅ Access personal settings (except role)
- ❌ Cannot create projects or conduct reviews
- ❌ Cannot raise red flags
- ❌ Cannot export data or access admin features

## 🛡️ Permission System

### **Core Permissions**

```typescript
interface Permission {
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
}
```

### **Permission Utility Functions**

```typescript
// Check specific permission
hasPermission(userRole, "canExportData");

// Check feature access
canViewFeature(userRole, "admin");

// Check role-based access
canManageUsers(userRole);
canChangeUserRoles(userRole);
canAccessAdmin(userRole);
```

## 🎨 UI Components for Role-Based Access

### **RoleGuard Component**

```tsx
// Show content only to specific roles
<RoleGuard allowedRoles={['ADMIN', 'GATEKEEPER']}>
  <AdminButton />
</RoleGuard>

// Show content based on permissions
<RoleGuard requiredPermission="canExportData">
  <ExportButton />
</RoleGuard>

// Show content based on features
<RoleGuard feature="admin">
  <AdminPanel />
</RoleGuard>
```

### **Specialized Components**

```tsx
// Admin-only content
<AdminOnly>
  <UserManagement />
</AdminOnly>

// Gatekeeper or Admin content
<GatekeeperOrAdmin>
  <ReviewManagement />
</GatekeeperOrAdmin>

// Export functionality
<ExportOnly>
  <ExportButton />
</ExportOnly>
```

### **Permission Hooks**

```tsx
function MyComponent() {
  const {
    canManageUsers,
    canExportData,
    canAccessAdmin,
    checkPermission,
    checkFeature,
  } = usePermissions();

  return (
    <div>
      {canManageUsers && <UserManagementButton />}
      {canExportData && <ExportButton />}
      {checkPermission("canConductReviews") && <ReviewButton />}
    </div>
  );
}
```

## 🔒 Security Features

### **1. Self-Role-Change Prevention**

- Users cannot modify their own role through any interface
- Role field is read-only in user settings
- API endpoints validate that users aren't changing their own roles
- Clear error messages when attempting unauthorized role changes

### **2. Navigation Security**

- Sidebar navigation items filtered by permissions
- Admin panel only visible to administrators
- User management only visible to authorized roles
- Export options only shown to users with export permissions

### **3. API Security**

- All sensitive endpoints check user permissions
- Role validation on server-side for all operations
- Proper error responses for unauthorized access
- Activity logging for security-sensitive operations

### **4. UI Security**

- Buttons and forms hidden for unauthorized users
- Graceful fallbacks for missing permissions
- Clear access denied messages
- No sensitive information exposed to unauthorized users

## 📋 Implementation Examples

### **Protecting API Routes**

```typescript
export async function updateUserRole(userId: string, role: string) {
  const session = await auth();
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  // Check permissions
  if (!canChangeUserRoles(currentUser.role as UserRole)) {
    return { error: "Unauthorized to update user roles" };
  }

  // Prevent self-role-change
  if (currentUser.id === userId) {
    return { error: "You cannot change your own role" };
  }

  // Proceed with role update...
}
```

### **Protecting UI Components**

```tsx
// Navigation with role-based filtering
const getNavigation = (userRole: string) => {
  const role = userRole as UserRole;
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderOpen },
  ];

  // Add items based on permissions
  if (canViewFeature(role, "reviews")) {
    navigation.push({
      name: "Gate Reviews",
      href: "/reviews",
      icon: ClipboardCheck,
    });
  }

  if (canAccessAdmin(role)) {
    navigation.push({ name: "Administration", href: "/admin", icon: Shield });
  }

  return navigation;
};
```

### **Protecting Pages**

```tsx
export default async function AdminPage() {
  const session = await auth();

  if (!hasPermission(session.user.role as UserRole, "canAccessAdminPanel")) {
    return <AccessDenied />;
  }

  return <AdminContent />;
}
```

## 🚨 Security Best Practices

### **1. Defense in Depth**

- ✅ Client-side UI filtering (user experience)
- ✅ Server-side API validation (security)
- ✅ Database-level constraints (data integrity)
- ✅ Activity logging (audit trail)

### **2. Principle of Least Privilege**

- ✅ Users get minimum permissions needed for their role
- ✅ No unnecessary access to sensitive features
- ✅ Clear separation of concerns between roles
- ✅ Regular permission reviews and updates

### **3. Secure by Default**

- ✅ New users get minimal permissions (USER role)
- ✅ Features require explicit permission grants
- ✅ Fallback to deny access when in doubt
- ✅ Clear error messages for unauthorized access

## 🔧 Configuration & Maintenance

### **Adding New Permissions**

1. Add permission to `Permission` interface in `lib/permissions.ts`
2. Update role definitions in `rolePermissions`
3. Add utility functions if needed
4. Update UI components to use new permission
5. Add server-side validation in relevant actions

### **Creating New Roles**

1. Add role to `UserRole` type
2. Define permissions in `rolePermissions`
3. Update database schema if needed
4. Add role to UI selection components
5. Test all permission combinations

### **Modifying Existing Permissions**

1. Update permission definitions
2. Review impact on existing users
3. Update UI components and API endpoints
4. Test thoroughly before deployment
5. Document changes for users

## 📊 Monitoring & Auditing

### **Activity Logging**

- All role changes are logged with timestamps
- User actions are tracked for security auditing
- Failed permission checks are logged
- Regular review of access patterns

### **Permission Reviews**

- Regular audits of user roles and permissions
- Removal of unnecessary access rights
- Updates based on organizational changes
- Documentation of permission changes

## 🆘 Troubleshooting

### **Common Issues**

**1. User Can't Access Feature**

- Check user's role in database
- Verify permission definitions
- Check UI component permission requirements
- Review API endpoint security

**2. Permission Denied Errors**

- Verify user authentication
- Check role-permission mapping
- Review server-side validation
- Check for typos in permission names

**3. UI Elements Not Showing**

- Check RoleGuard component usage
- Verify permission hook implementation
- Review navigation filtering logic
- Check component prop passing

### **Debug Tools**

```tsx
// Debug current user permissions
const { user, checkPermission } = usePermissions();
console.log("User role:", user?.role);
console.log("Can export:", checkPermission("canExportData"));
```

## 🎯 Future Enhancements

### **Planned Features**

1. **Custom Role Builder**: UI for creating custom roles with specific permissions
2. **Temporary Permissions**: Time-limited access grants
3. **Permission Groups**: Grouping related permissions for easier management
4. **Advanced Auditing**: Detailed permission usage analytics
5. **Role Templates**: Pre-defined role configurations for common use cases

The role-based access control system provides comprehensive security while maintaining usability. Users see only the features they need, and sensitive operations are properly protected at all levels of the application.
