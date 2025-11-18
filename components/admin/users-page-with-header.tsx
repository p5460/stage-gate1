"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UsersPageClient } from "./users-page-client";

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

interface CustomRole {
  id: string;
  name: string;
  color?: string | null;
  isActive: boolean;
}

interface UsersPageWithHeaderProps {
  users: User[];
  customRoles?: CustomRole[];
}

export function UsersPageWithHeader({
  users,
  customRoles = [],
}: UsersPageWithHeaderProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with properly aligned Add User button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BackButton href="/admin" label="Back to Admin" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Users list component */}
      <UsersPageClient
        users={users}
        customRoles={customRoles}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
      />
    </div>
  );
}
