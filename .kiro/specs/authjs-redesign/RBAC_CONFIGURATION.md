# Role-Based Access Control (RBAC) Configuration Guide

## Overview

This guide explains how to configure and customize the Role-Based Access Control (RBAC) system in the authentication architecture.

## Role Definitions

### Available Roles

The system supports the following roles defined in the Prisma schema:

```prisma
enum UserRole {
  ADMIN          // Full system access
  USER           // Basic user access
  GATEKEEPER     // Review and approval access
  PROJECT_LEAD   // Project management access
  RESEARCHER     // Research access
  REVIEWER       // Review access
  CUSTOM         // Custom role access
}
```

### Role Hierarchy

```
ADMIN (Highest)
  ├── Full system access
  ├── Can access all routes
  └── Can manage all users and roles

GATEKEEPER
  ├── Administrative access
  ├── Review and approval access
  └── Can access admin and review routes

PROJECT_LEAD
  ├── Project management access
  ├── Can create and edit projects
  └── Can access project and report routes

REVIEWER
  ├── Review access
  ├── Can review projects
  └── Can access review routes

RESEARCHER
  ├── Research access
  └── Limited to research-related routes

USER (Lowest)
  ├── Basic access
  └── Can access general user routes

CUSTOM
  └── Custom-defined permissions
```

## Route Protection Configuration

### Current Route Rules

Defined in `middleware.ts`:

| Route Pattern      | Allowed Roles                             | Description              |
| ------------------ | ----------------------------------------- | ------------------------ |
| `/admin/*`         | ADMIN, GATEKEEPER                         | Administrative functions |
| `/reviews/*`       | ADMIN, GATEKEEPER, REVIEWER               | Review management        |
| `/projects/create` | ADMIN, PROJECT_LEAD, GATEKEEPER           | Project creation         |
| `/projects/*/edit` | ADMIN, PROJECT_LEAD, GATEKEEPER           | Project editing          |
| `/reports/*`       | ADMIN, GATEKEEPER, PROJECT_LEAD, REVIEWER | Report access            |
| `/dashboard`       | All authenticated users                   | User dashboard           |
| `/settings`        | All authenticated users                   | User settings            |

### Middleware Implementation

```typescript
// middleware.ts
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Admin routes
  if (nextUrl.pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Review routes
  if (
    nextUrl.pathname.startsWith("/reviews") ||
    nextUrl.pathname.includes("/review")
  ) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "GATEKEEPER" &&
      userRole !== "REVIEWER"
    ) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Project creation/editing routes
  if (
    nextUrl.pathname.startsWith("/projects/create") ||
    (nextUrl.pathname.includes("/projects/") &&
      nextUrl.pathname.includes("/edit"))
  ) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "PROJECT_LEAD" &&
      userRole !== "GATEKEEPER"
    ) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Report routes
  if (nextUrl.pathname.startsWith("/reports")) {
    if (
      userRole !== "ADMIN" &&
      userRole !== "GATEKEEPER" &&
      userRole !== "PROJECT_LEAD" &&
      userRole !== "REVIEWER"
    ) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return;
});
```

## Adding New Routes

### Step 1: Define Route Pattern

Decide on the route pattern and which roles should have access.

**Example**: Add a `/analytics` route accessible by ADMIN and GATEKEEPER

### Step 2: Update Middleware

Add the route check to `middleware.ts`:

```typescript
// middleware.ts
export default auth((req) => {
  const { nextUrl } = req;
  const userRole = req.auth?.user?.role;

  // ... existing route checks ...

  // Analytics routes (NEW)
  if (nextUrl.pathname.startsWith("/analytics")) {
    if (userRole !== "ADMIN" && userRole !== "GATEKEEPER") {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return;
});
```

### Step 3: Test the Route

```bash
# Test as different roles
# 1. Log in as ADMIN - should access /analytics
# 2. Log in as USER - should redirect to /dashboard
# 3. Log in as GATEKEEPER - should access /analytics
```

## Adding New Roles

### Step 1: Update Prisma Schema

```prisma
// prisma/schema.prisma
enum UserRole {
  ADMIN
  USER
  GATEKEEPER
  PROJECT_LEAD
  RESEARCHER
  REVIEWER
  CUSTOM
  ANALYST        // NEW ROLE
}
```

### Step 2: Create Migration

```bash
npx prisma migrate dev --name add_analyst_role
```

### Step 3: Update TypeScript Types

The types are automatically generated from Prisma, but verify:

```typescript
// next-auth.d.ts
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole; // Includes new ANALYST role
      // ... other fields
    };
  }
}
```

### Step 4: Add Route Rules

Update middleware to include the new role:

```typescript
// middleware.ts
if (nextUrl.pathname.startsWith("/analytics")) {
  if (
    userRole !== "ADMIN" &&
    userRole !== "GATEKEEPER" &&
    userRole !== "ANALYST" // NEW ROLE
  ) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }
}
```

### Step 5: Update Default Role Assignment

If needed, update the default role for new users:

```typescript
// auth.ts
async signIn({ user, account }) {
  if (account?.provider !== "credentials") {
    const existingUser = await getUserByEmail(user.email!);
    if (existingUser && !existingUser.role) {
      await db.user.update({
        where: { id: existingUser.id },
        data: { role: "USER" }, // Or "ANALYST" for specific domains
      });
    }
    return true;
  }
  // ...
}
```

## Component-Level Access Control

### Using RoleGate Component

Create a reusable component for role-based rendering:

```typescript
// components/auth/role-gate.tsx
import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGate = ({
  children,
  allowedRoles,
  fallback = null,
}: RoleGateProps) => {
  const role = useCurrentRole();

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

**Usage**:

```typescript
// In your component
import { RoleGate } from "@/components/auth/role-gate";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <RoleGate allowedRoles={["ADMIN", "GATEKEEPER"]}>
        <AdminPanel />
      </RoleGate>

      <RoleGate
        allowedRoles={["ADMIN", "PROJECT_LEAD"]}
        fallback={<p>You don't have access to this feature.</p>}
      >
        <ProjectCreationButton />
      </RoleGate>
    </div>
  );
}
```

### Server-Side Access Control

For server components and API routes:

```typescript
// app/admin/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "GATEKEEPER") {
    redirect("/dashboard");
  }

  return <AdminDashboard />;
}
```

### API Route Protection

```typescript
// app/api/admin/route.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "GATEKEEPER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admin logic here
  return NextResponse.json({ data: "admin data" });
}
```

## Permission Helpers

### Create Permission Utilities

```typescript
// lib/permissions.ts
import { UserRole } from "@prisma/client";

export const permissions = {
  canAccessAdmin: (role: UserRole) => {
    return role === "ADMIN" || role === "GATEKEEPER";
  },

  canAccessReviews: (role: UserRole) => {
    return role === "ADMIN" || role === "GATEKEEPER" || role === "REVIEWER";
  },

  canCreateProjects: (role: UserRole) => {
    return role === "ADMIN" || role === "PROJECT_LEAD" || role === "GATEKEEPER";
  },

  canEditProject: (role: UserRole, projectOwnerId: string, userId: string) => {
    // Admins and gatekeepers can edit any project
    if (role === "ADMIN" || role === "GATEKEEPER") {
      return true;
    }

    // Project leads can edit their own projects
    if (role === "PROJECT_LEAD" && projectOwnerId === userId) {
      return true;
    }

    return false;
  },

  canAccessReports: (role: UserRole) => {
    return (
      role === "ADMIN" ||
      role === "GATEKEEPER" ||
      role === "PROJECT_LEAD" ||
      role === "REVIEWER"
    );
  },
};
```

**Usage**:

```typescript
import { permissions } from "@/lib/permissions";
import { useCurrentRole } from "@/hooks/use-current-role";

export function ProjectActions({ project }) {
  const role = useCurrentRole();
  const session = useSession();

  const canEdit = permissions.canEditProject(
    role,
    project.ownerId,
    session?.user?.id
  );

  return (
    <div>
      {canEdit && <EditButton projectId={project.id} />}
    </div>
  );
}
```

## Custom Role Logic

### Implementing Custom Roles

For the `CUSTOM` role type, you can implement custom permission logic:

```typescript
// lib/custom-permissions.ts
import { db } from "@/lib/db";

export async function getCustomPermissions(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { customPermissions: true },
  });

  return user?.customPermissions || [];
}

export async function hasCustomPermission(userId: string, permission: string) {
  const permissions = await getCustomPermissions(userId);
  return permissions.some((p) => p.name === permission);
}
```

**Usage**:

```typescript
// In your component or API route
const canAccessFeature = await hasCustomPermission(
  session.user.id,
  "access_special_feature"
);

if (!canAccessFeature) {
  return <AccessDenied />;
}
```

## Role Assignment

### Assigning Roles to Users

#### Via Admin Interface

Create an admin interface to manage user roles:

```typescript
// app/admin/users/[id]/page.tsx
import { updateUserRole } from "@/actions/users";

export default function EditUserPage({ params }) {
  async function handleRoleChange(formData: FormData) {
    "use server";

    const role = formData.get("role") as UserRole;
    await updateUserRole(params.id, role);
  }

  return (
    <form action={handleRoleChange}>
      <select name="role">
        <option value="USER">User</option>
        <option value="ADMIN">Admin</option>
        <option value="GATEKEEPER">Gatekeeper</option>
        <option value="PROJECT_LEAD">Project Lead</option>
        <option value="RESEARCHER">Researcher</option>
        <option value="REVIEWER">Reviewer</option>
        <option value="CUSTOM">Custom</option>
      </select>
      <button type="submit">Update Role</button>
    </form>
  );
}
```

#### Via Database

```sql
-- Update user role directly in database
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'user@example.com';
```

#### Via Prisma Studio

```bash
npx prisma studio
# Navigate to User table
# Edit role field
# Save changes
```

### Default Role for New Users

Configure in `auth.ts`:

```typescript
// auth.ts
async signIn({ user, account }) {
  if (account?.provider !== "credentials") {
    const existingUser = await getUserByEmail(user.email!);
    if (existingUser && !existingUser.role) {
      // Assign default role based on email domain or other criteria
      const defaultRole = user.email?.endsWith("@company.com")
        ? "PROJECT_LEAD"
        : "USER";

      await db.user.update({
        where: { id: existingUser.id },
        data: { role: defaultRole },
      });
    }
    return true;
  }
  // ...
}
```

## Testing RBAC

### Manual Testing

```bash
# 1. Create test users with different roles
npx prisma studio

# 2. Test each role
# - Log in as ADMIN - should access all routes
# - Log in as USER - should be restricted
# - Log in as GATEKEEPER - should access admin routes
# - Log in as PROJECT_LEAD - should access project routes
# - Log in as REVIEWER - should access review routes
```

### Automated Testing

```typescript
// __tests__/rbac.test.ts
import { permissions } from "@/lib/permissions";

describe("RBAC Permissions", () => {
  describe("canAccessAdmin", () => {
    it("should allow ADMIN", () => {
      expect(permissions.canAccessAdmin("ADMIN")).toBe(true);
    });

    it("should allow GATEKEEPER", () => {
      expect(permissions.canAccessAdmin("GATEKEEPER")).toBe(true);
    });

    it("should deny USER", () => {
      expect(permissions.canAccessAdmin("USER")).toBe(false);
    });
  });

  describe("canCreateProjects", () => {
    it("should allow ADMIN", () => {
      expect(permissions.canCreateProjects("ADMIN")).toBe(true);
    });

    it("should allow PROJECT_LEAD", () => {
      expect(permissions.canCreateProjects("PROJECT_LEAD")).toBe(true);
    });

    it("should deny USER", () => {
      expect(permissions.canCreateProjects("USER")).toBe(false);
    });
  });
});
```

## Best Practices

### Do's

✅ Use middleware for route-level protection
✅ Use component-level gates for UI elements
✅ Use server-side checks for sensitive operations
✅ Create reusable permission helpers
✅ Test all role combinations
✅ Document role capabilities clearly
✅ Use TypeScript for type safety
✅ Log access attempts for auditing

### Don'ts

❌ Don't rely solely on client-side checks
❌ Don't hardcode role checks everywhere
❌ Don't forget to check roles in API routes
❌ Don't expose sensitive data based on UI hiding alone
❌ Don't create too many granular roles (keep it simple)
❌ Don't forget to update tests when adding roles

## Troubleshooting

### User Can't Access Expected Routes

**Check**:

1. User's role in database
2. Middleware route rules
3. Session includes role
4. JWT token includes role

```javascript
// In browser console
fetch("/api/auth/session")
  .then((r) => r.json())
  .then((s) => console.log("Role:", s?.user?.role));
```

### Role Not Updating

**Solution**: Force session refresh

```typescript
// In your component
import { useSession } from "next-auth/react";

const { data: session, update } = useSession();

// After role change
await update();
```

### Middleware Not Enforcing Rules

**Check**:

1. Middleware matcher config
2. Route pattern matching
3. Role comparison logic

```typescript
// Add logging
export default auth((req) => {
  console.log("Path:", req.nextUrl.pathname);
  console.log("Role:", req.auth?.user?.role);
  // ... rest of logic
});
```

## Security Considerations

### Defense in Depth

Always implement multiple layers of access control:

1. **Middleware**: Route-level protection
2. **Server Components**: Page-level checks
3. **API Routes**: Endpoint-level validation
4. **Database**: Row-level security (if supported)

### Audit Logging

Log all access attempts:

```typescript
// lib/audit-log.ts
export async function logAccess(
  userId: string,
  resource: string,
  action: string,
  allowed: boolean
) {
  await db.auditLog.create({
    data: {
      userId,
      resource,
      action,
      allowed,
      timestamp: new Date(),
    },
  });
}
```

### Regular Reviews

- Review role assignments quarterly
- Audit access logs for suspicious activity
- Remove unused roles
- Update permissions as requirements change

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
