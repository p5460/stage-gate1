"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { toggleUserStatus, deleteUser, updateUserRole } from "@/actions/users";
import { assignCustomRoleToUser } from "@/actions/custom-roles";
import { toast } from "sonner";
import { usePermissions } from "@/components/auth/role-guard";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface CustomRole {
  id: string;
  name: string;
  color?: string | null;
  isActive: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  customRoleId?: string | null;
  customRole?: CustomRole | null;
  department: string | null;
  position: string | null;
  emailVerified: Date | null;
  _count: {
    projectsLed: number;
    projectMembers: number;
  };
}

interface UsersPageClientProps {
  users: User[];
  customRoles?: CustomRole[];
  showCreateForm?: boolean;
  setShowCreateForm?: (show: boolean) => void;
}

export function UsersPageClient({
  users,
  customRoles = [],
  showCreateForm: externalShowCreateForm,
  setShowCreateForm: externalSetShowCreateForm,
}: UsersPageClientProps) {
  const [internalShowCreateForm, setInternalShowCreateForm] = useState(false);

  // Use external state if provided, otherwise use internal state
  const showCreateForm =
    externalShowCreateForm !== undefined
      ? externalShowCreateForm
      : internalShowCreateForm;
  const setShowCreateForm =
    externalSetShowCreateForm || setInternalShowCreateForm;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { user: currentUser, canChangeRoles } = usePermissions();

  const getRoleColor = (role: string, customRole?: CustomRole | null) => {
    if (role === "CUSTOM" && customRole) {
      return `bg-gray-100 text-gray-800`;
    }

    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "GATEKEEPER":
        return "bg-purple-100 text-purple-800";
      case "PROJECT_LEAD":
        return "bg-blue-100 text-blue-800";
      case "RESEARCHER":
        return "bg-green-100 text-green-800";
      case "REVIEWER":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role: string, customRole?: CustomRole | null) => {
    if (role === "CUSTOM" && customRole) {
      return customRole.name;
    }
    return role.replace(/_/g, " ");
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Prevent users from changing their own role
    if (currentUser?.id === userId) {
      toast.error("You cannot change your own role");
      return;
    }

    startTransition(async () => {
      let result;

      if (newRole.startsWith("custom_")) {
        // Assign custom role (only if custom roles are available)
        if (customRoles && customRoles.length > 0) {
          const customRoleId = newRole.replace("custom_", "");
          result = await assignCustomRoleToUser(userId, customRoleId);
        } else {
          toast.error("Custom roles are not available");
          return;
        }
      } else if (newRole === "remove_custom") {
        // Remove custom role (only if custom roles are available)
        if (customRoles && customRoles.length > 0) {
          result = await assignCustomRoleToUser(userId, null);
        } else {
          toast.error("Custom roles are not available");
          return;
        }
      } else {
        // Assign built-in role
        result = await updateUserRole(userId, newRole);
      }

      if (result.success) {
        toast.success("User role updated successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update user role");
      }
    });
  };

  const handleToggleStatus = (userId: string) => {
    startTransition(async () => {
      const result = await toggleUserStatus(userId);
      if (result.success) {
        toast.success("User status updated successfully!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update user status");
      }
    });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (
      confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      startTransition(async () => {
        const result = await deleteUser(userId);
        if (result.success) {
          toast.success("User deleted successfully!");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to delete user");
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users.length} users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={getRoleColor(user.role, user.customRole)}
                        >
                          {getRoleDisplayName(user.role, user.customRole)}
                        </Badge>
                        <Select
                          value={
                            user.role === "CUSTOM"
                              ? `custom_${user.customRoleId}`
                              : user.role
                          }
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value)
                          }
                          disabled={
                            isPending ||
                            currentUser?.id === user.id ||
                            !canChangeRoles
                          }
                        >
                          <SelectTrigger className="w-8 h-8 p-0 border-none bg-transparent">
                            <Edit className="h-3 w-3" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="RESEARCHER">
                              Researcher
                            </SelectItem>
                            <SelectItem value="REVIEWER">Reviewer</SelectItem>
                            <SelectItem value="PROJECT_LEAD">
                              Project Lead
                            </SelectItem>
                            <SelectItem value="GATEKEEPER">
                              Gatekeeper
                            </SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            {customRoles.length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-t">
                                  Custom Roles
                                </div>
                                {customRoles
                                  .filter((role) => role.isActive)
                                  .map((role) => (
                                    <SelectItem
                                      key={role.id}
                                      value={`custom_${role.id}`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{
                                            backgroundColor:
                                              role.color || "#6B7280",
                                          }}
                                        />
                                        <span>{role.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                {user.role === "CUSTOM" && (
                                  <SelectItem
                                    value="remove_custom"
                                    className="text-red-600"
                                  >
                                    Remove Custom Role
                                  </SelectItem>
                                )}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{user.department}</div>
                        <div className="text-xs text-gray-400">
                          {user.position}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>Leading: {user._count?.projectsLed || 0}</div>
                        <div>Member: {user._count?.projectMembers || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          user.emailVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {user.emailVerified ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="outline" size="sm" disabled>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={isPending}
                      >
                        {user.emailVerified ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() =>
                          handleDeleteUser(user.id, user.name || "User")
                        }
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CreateUserForm open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  );
}
