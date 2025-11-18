"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Users,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  duplicateCustomRole,
} from "@/actions/custom-roles";
// Permission categories mapping
const PERMISSION_CATEGORIES = {
  PROJECT: "Project Management",
  GATE_REVIEW: "Gate Reviews",
  DOCUMENT: "Document Management",
  RISK: "Risk Management",
  COMMENT: "Comments & Collaboration",
  MILESTONE: "Milestone Tracking",
  USER: "User Management",
  SYSTEM: "System Administration",
  BUDGET: "Budget Management",
  NOTIFICATION: "Notifications",
};

interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category: string;
}

interface CustomRole {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  permissions: {
    permission: Permission;
  }[];
  _count: {
    users: number;
  };
}

interface CustomRolesClientProps {
  customRoles: CustomRole[];
  permissions: Permission[];
  isCreateDialogOpen?: boolean;
  setIsCreateDialogOpen?: (open: boolean) => void;
}

export function CustomRolesClient({
  customRoles,
  permissions,
  isCreateDialogOpen: externalIsCreateDialogOpen,
  setIsCreateDialogOpen: externalSetIsCreateDialogOpen,
}: CustomRolesClientProps) {
  const router = useRouter();
  const [internalIsCreateDialogOpen, setInternalIsCreateDialogOpen] =
    useState(false);

  // Use external state if provided, otherwise use internal state
  const isCreateDialogOpen =
    externalIsCreateDialogOpen !== undefined
      ? externalIsCreateDialogOpen
      : internalIsCreateDialogOpen;
  const setIsCreateDialogOpen =
    externalSetIsCreateDialogOpen || setInternalIsCreateDialogOpen;
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Group permissions by category
  const permissionsByCategory = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const handleCreateRole = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const color = formData.get("color") as string;

      // Get selected permissions
      const permissionIds: string[] = [];
      permissions.forEach((permission) => {
        if (formData.get(`permission_${permission.id}`)) {
          permissionIds.push(permission.id);
        }
      });

      const result = await createCustomRole({
        name,
        description,
        color,
        permissionIds,
      });

      if (result.success) {
        toast.success("Custom role created successfully");
        setIsCreateDialogOpen(false);
        router.refresh(); // Refresh to show new role
      } else {
        toast.error(result.error || "Failed to create custom role");
      }
    } catch (error) {
      toast.error("An error occurred while creating the role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (formData: FormData) => {
    if (!editingRole) return;

    setIsLoading(true);
    try {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const color = formData.get("color") as string;
      const isActive = formData.get("isActive") === "on";

      // Get selected permissions
      const permissionIds: string[] = [];
      permissions.forEach((permission) => {
        if (formData.get(`permission_${permission.id}`)) {
          permissionIds.push(permission.id);
        }
      });

      const result = await updateCustomRole(editingRole.id, {
        name,
        description,
        color,
        isActive,
        permissionIds,
      });

      if (result.success) {
        toast.success("Custom role updated successfully");
        setEditingRole(null);
        router.refresh(); // Refresh to show updated role
      } else {
        toast.error(result.error || "Failed to update custom role");
      }
    } catch (error) {
      toast.error("An error occurred while updating the role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    setIsLoading(true);
    try {
      const result = await deleteCustomRole(roleId);

      if (result.success) {
        toast.success(`Role "${roleName}" deleted successfully`);
        router.refresh(); // Refresh to remove deleted role
      } else {
        toast.error(result.error || "Failed to delete custom role");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateRole = async (roleId: string, originalName: string) => {
    const newName = prompt(
      `Enter name for duplicate of "${originalName}":`,
      `${originalName} Copy`
    );
    if (!newName) return;

    setIsLoading(true);
    try {
      const result = await duplicateCustomRole(roleId, newName);

      if (result.success) {
        toast.success(`Role duplicated as "${newName}"`);
        router.refresh(); // Refresh to show new role
      } else {
        toast.error(result.error || "Failed to duplicate custom role");
      }
    } catch (error) {
      toast.error("An error occurred while duplicating the role");
    } finally {
      setIsLoading(false);
    }
  };

  const RoleForm = ({
    role,
    onSubmit,
  }: {
    role?: CustomRole;
    onSubmit: (formData: FormData) => void;
  }) => {
    const rolePermissionIds =
      role?.permissions.map((rp) => rp.permission.id) || [];

    return (
      <form action={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={role?.name}
              placeholder="Enter role name"
              required
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              name="color"
              type="color"
              defaultValue={role?.color || "#6B7280"}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={role?.description || ""}
            placeholder="Enter role description"
            rows={3}
          />
        </div>

        {role && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              name="isActive"
              defaultChecked={role.isActive}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        )}

        <div>
          <Label className="text-base font-semibold">Permissions</Label>
          <div className="mt-4 space-y-6">
            {Object.entries(permissionsByCategory).map(
              ([category, categoryPermissions]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-900">
                    {PERMISSION_CATEGORIES[
                      category as keyof typeof PERMISSION_CATEGORIES
                    ] || category}
                  </h4>
                  <div className="grid grid-cols-1 gap-3 pl-4">
                    {categoryPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start space-x-3"
                      >
                        <Checkbox
                          id={`permission_${permission.id}`}
                          name={`permission_${permission.id}`}
                          defaultChecked={rolePermissionIds.includes(
                            permission.id
                          )}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`permission_${permission.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {permission.name}
                          </Label>
                          {permission.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingRole(null);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : role ? "Update Role" : "Create Role"}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
          </DialogHeader>
          <RoleForm onSubmit={handleCreateRole} />
        </DialogContent>
      </Dialog>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customRoles.map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: role.color || "#6B7280" }}
                  />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingRole(role)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicateRole(role.id, role.name)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-600"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the role "
                            {role.name}"? This action cannot be undone.
                            {role._count.users > 0 && (
                              <span className="block mt-2 text-red-600 font-medium">
                                Warning: {role._count.users} users are currently
                                assigned to this role.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRole(role.id, role.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {role.description && (
                <p className="text-sm text-gray-600 mt-2">{role.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>{role.permissions.length} permissions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{role._count.users} users</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={role.isActive ? "default" : "secondary"}>
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {role.permissions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Key Permissions:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((rp) => (
                        <Badge
                          key={rp.permission.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {rp.permission.name}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customRoles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No custom roles
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first custom role to get started using the "Create
              Role" button above.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingRole}
        onOpenChange={(open) => !open && setEditingRole(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <RoleForm role={editingRole} onSubmit={handleUpdateRole} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
