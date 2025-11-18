"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Flag, DollarSign } from "lucide-react";
import { toast } from "sonner";
import {
  addProjectMember,
  raiseRedFlag,
  updateProject,
} from "@/actions/projects";

interface Project {
  id: string;
  projectId: string;
  name: string;
  status: string;
  currentStage: string;
  budget?: number | null;
  budgetUtilization?: number | null;
  lead: {
    id: string;
    name: string | null;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface ProjectActionsProps {
  project: Project;
  users: User[];
  currentUserId: string;
  currentUserRole: string;
  onUpdate?: () => void;
}

export function ProjectActions({
  project,
  users,
  currentUserId,
  currentUserRole,
  onUpdate,
}: ProjectActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  // Form states
  const [memberData, setMemberData] = useState({
    userId: "",
    role: "TEAM_MEMBER",
  });

  const [redFlagData, setRedFlagData] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
  });

  const [budgetData, setBudgetData] = useState({
    budget: project.budget || 0,
    budgetUtilization: project.budgetUtilization || 0,
  });

  // Check permissions
  const isAdmin = currentUserRole === "ADMIN";
  const isGatekeeper = currentUserRole === "GATEKEEPER";
  const isProjectLead = project.lead.id === currentUserId;

  const canAddMembers = isAdmin || isGatekeeper || isProjectLead;
  const canRaiseRedFlags = true; // Anyone can raise red flags
  const canManageBudget = isAdmin || isGatekeeper || isProjectLead;

  const handleAddMember = () => {
    if (!memberData.userId) {
      toast.error("Please select a user to add");
      return;
    }

    startTransition(async () => {
      try {
        const result = await addProjectMember(
          project.id,
          memberData.userId,
          memberData.role
        );

        if (result.success) {
          toast.success("Team member added successfully");
          setActiveDialog(null);
          setMemberData({ userId: "", role: "TEAM_MEMBER" });
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to add team member");
        }
      } catch (error) {
        toast.error("An error occurred while adding team member");
      }
    });
  };

  const handleRaiseRedFlag = () => {
    if (!redFlagData.title.trim() || !redFlagData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        const result = await raiseRedFlag(
          project.id,
          redFlagData.title.trim(),
          redFlagData.description.trim(),
          redFlagData.severity
        );

        if (result.success) {
          toast.success("Red flag raised successfully");
          setActiveDialog(null);
          setRedFlagData({ title: "", description: "", severity: "MEDIUM" });
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to raise red flag");
        }
      } catch (error) {
        toast.error("An error occurred while raising red flag");
      }
    });
  };

  const handleUpdateBudget = () => {
    if (
      budgetData.budget < 0 ||
      budgetData.budgetUtilization < 0 ||
      budgetData.budgetUtilization > 100
    ) {
      toast.error("Please enter valid budget values");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateProject(project.id, {
          budget: budgetData.budget,
          budgetUtilization: budgetData.budgetUtilization,
        });

        if (result.success) {
          toast.success("Budget updated successfully");
          setActiveDialog(null);
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to update budget");
        }
      } catch (error) {
        toast.error("An error occurred while updating budget");
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "ON_HOLD":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "TERMINATED":
        return "bg-gray-100 text-gray-800";
      case "RED_FLAG":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const availableUsers = users.filter(
    (user) =>
      user.id !== project.lead.id &&
      [
        "ADMIN",
        "GATEKEEPER",
        "PROJECT_LEAD",
        "RESEARCHER",
        "TEAM_MEMBER",
      ].includes(user.role)
  );

  return (
    <div className="flex flex-wrap gap-2">
      {/* Add Team Member */}
      {canAddMembers && (
        <Dialog
          open={activeDialog === "add-member"}
          onOpenChange={(open) => setActiveDialog(open ? "add-member" : null)}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select
                  value={memberData.userId}
                  onValueChange={(value) =>
                    setMemberData({ ...memberData, userId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={memberData.role}
                  onValueChange={(value) =>
                    setMemberData({ ...memberData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                    <SelectItem value="RESEARCHER">Researcher</SelectItem>
                    <SelectItem value="TECHNICAL_LEAD">
                      Technical Lead
                    </SelectItem>
                    <SelectItem value="BUSINESS_ANALYST">
                      Business Analyst
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActiveDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} disabled={isPending}>
                  {isPending ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Raise Red Flag */}
      {canRaiseRedFlags && (
        <Dialog
          open={activeDialog === "red-flag"}
          onOpenChange={(open) => setActiveDialog(open ? "red-flag" : null)}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Flag className="h-4 w-4 mr-2" />
              Raise Red Flag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise Red Flag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={redFlagData.title}
                  onChange={(e) =>
                    setRedFlagData({ ...redFlagData, title: e.target.value })
                  }
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={redFlagData.description}
                  onChange={(e) =>
                    setRedFlagData({
                      ...redFlagData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detailed description of the red flag"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={redFlagData.severity}
                  onValueChange={(value) =>
                    setRedFlagData({ ...redFlagData, severity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Raising a red flag will change the
                  project status and notify relevant stakeholders.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActiveDialog(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRaiseRedFlag}
                  disabled={isPending}
                  variant="destructive"
                >
                  {isPending ? "Raising..." : "Raise Red Flag"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Budget */}
      {canManageBudget && (
        <Dialog
          open={activeDialog === "budget"}
          onOpenChange={(open) => setActiveDialog(open ? "budget" : null)}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Update Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Project Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Current Budget Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Budget:</span>
                      <span>R{(project.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization:</span>
                      <span>{project.budgetUtilization || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent:</span>
                      <span>
                        R
                        {(
                          ((project.budget || 0) *
                            (project.budgetUtilization || 0)) /
                          100
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span>
                        R
                        {(
                          (project.budget || 0) -
                          ((project.budget || 0) *
                            (project.budgetUtilization || 0)) /
                            100
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Total Budget (R)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={budgetData.budget}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        budget: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter total budget"
                  />
                </div>
                <div>
                  <Label htmlFor="utilization">Utilization (%)</Label>
                  <Input
                    id="utilization"
                    type="number"
                    min="0"
                    max="100"
                    value={budgetData.budgetUtilization}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        budgetUtilization: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter utilization %"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800 space-y-1">
                  <div>
                    New Spent Amount: R
                    {(
                      (budgetData.budget * budgetData.budgetUtilization) /
                      100
                    ).toLocaleString()}
                  </div>
                  <div>
                    New Remaining: R
                    {(
                      budgetData.budget -
                      (budgetData.budget * budgetData.budgetUtilization) / 100
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActiveDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateBudget} disabled={isPending}>
                  {isPending ? "Updating..." : "Update Budget"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Project Status Badge */}
      <div className="flex items-center">
        <Badge className={getStatusColor(project.status)}>
          {project.status.replace("_", " ")}
        </Badge>
      </div>
    </div>
  );
}
