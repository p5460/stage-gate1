import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canManageUsers, UserRole } from "@/lib/permissions";
import { CustomRolesPageWithHeader } from "@/components/admin/custom-roles-page-with-header";

export default async function CustomRolesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  if (!user || !canManageUsers(user.role as UserRole)) {
    redirect("/dashboard");
  }

  // Fetch custom roles and permissions
  const [customRoles, permissions] = await Promise.all([
    db.customRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.permission.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <CustomRolesPageWithHeader
      customRoles={customRoles}
      permissions={permissions}
    />
  );
}
