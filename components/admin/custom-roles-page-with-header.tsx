"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomRolesClient } from "./custom-roles-client";

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

interface CustomRolesPageWithHeaderProps {
  customRoles: CustomRole[];
  permissions: Permission[];
}

export function CustomRolesPageWithHeader({
  customRoles,
  permissions,
}: CustomRolesPageWithHeaderProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with properly aligned Create Role button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BackButton href="/admin" label="Back to Admin" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Roles</h1>
            <p className="text-gray-600">
              Create and manage custom roles with specific permissions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Custom roles list component */}
      <CustomRolesClient
        customRoles={customRoles}
        permissions={permissions}
        isCreateDialogOpen={isCreateDialogOpen}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
      />
    </div>
  );
}
