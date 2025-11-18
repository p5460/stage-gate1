"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Users,
  Calendar,
  DollarSign,
  Flag,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import {
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from "@/actions/projects";

interface Project {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  businessCase?: string;
  currentStage: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  budgetUtilization?: number;
  duration?: number;
  technologyReadiness?: string;
  ipPotential?: string;
  cluster: {
    id: string;
    name: string;
    color?: string;
  };
  lead: {
    id: string;
    name?: string;
    email?: string;
  };
  members?: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email?: string;
    };
    role: string;
  }>;
  _count?: {
    documents: number;
    redFlags: number;
    milestones: number;
    gateReviews: number;
  };
}

interface Cluster {
  id: string;
  name: string;
  color?: string;
}

interface User {
  id: string;
  name?: string;
  email?: string;
  role: string;
}

interface ProjectCrudOperationsProps {
  projects: Project[];
  clusters: Cluster[];
  users: User[];
  onUpdate?: () => void;
}

export function ProjectCrudOperations({
  projects,
  clusters,
  users,
  onUpdate,
}: ProjectCrudOperationsProps) {
  const [isPending, startTransition] = useTransition();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const {
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canManageProjectMembers,
    isAdmin,
    isProjectLead,
  } = usePermissions();

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    businessCase: "",
    clusterId: "",
    budget: "",
    duration: "",
    technologyReadiness: "",
    ipPotential: "",
    startDate: "",
    endDate: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    businessCase: "",
    clusterId: "",
    budget: "",
    duration: "",
    technologyReadiness: "",
    ipPotential: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  const [memberForm, setMemberForm] = useState({
    userId: "",
    role: "",
  });

  const handleCreate = () => {
    if (!createForm.name || !createForm.clusterId) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(createForm).forEach(([key, value]) => {
          if (value) formData.append(key, value);
        });

        const result = await createProject(formData);

        if (result.success) {
          toast.success("Project created successfully");
          setShowCreateDialog(false);
          setCreateForm({
            name: "",
            description: "",
            businessCase: "",
            clusterId: "",
            budget: "",
            duration: "",
            technologyReadiness: "",
            ipPotential: "",
            startDate: "",
            endDate: "",
          });
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to create project");
        }
      } catch (error) {
        toast.error("An error occurred while creating project");
      }
    });
  };

  const handleEdit = () => {
    if (!selectedProject || !editForm.name) return;

    startTransition(async () => {
      try {
        const result = await updateProject(selectedProject.id, {
          name: editForm.name,
          description: editForm.description,
          businessCase: editForm.businessCase,
          clusterId: editForm.clusterId,
          budget: editForm.budget ? parseFloat(editForm.budget) : undefined,
          duration: editForm.duration ? parseInt(editForm.duration) : undefined,
          technologyReadiness: editForm.technologyReadiness,
          ipPotential: editForm.ipPotential,
          startDate: editForm.startDate
            ? new Date(editForm.startDate)
            : undefined,
          endDate: editForm.endDate ? new Date(editForm.endDate) : undefined,
          status: editForm.status as any,
        });

        if (result.success) {
          toast.success("Project updated successfully");
          setShowEditDialog(false);
          setSelectedProject(null);
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to update project");
        }
      } catch (error) {
        toast.error("An error occurred while updating project");
      }
    });
  };

  const handleDelete = () => {
    if (!selectedProject) return;

    startTransition(async () => {
      try {
        const result = await deleteProject(selectedProject.id);

        if (result.success) {
          toast.success("Project deleted successfully");
          setShowDeleteDialog(false);
          setSelectedProject(null);
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to delete project");
        }
      } catch (error) {
        toast.error("An error occurred while deleting project");
      }
    });
  };

  const handleAddMember = () => {
    if (!selectedProject || !memberForm.userId || !memberForm.role) {
      toast.error("Please select a user and role");
      return;
    }

    startTransition(async () => {
      try {
        const result = await addProjectMember(
          selectedProject.id,
          memberForm.userId,
          memberForm.role
        );

        if (result.success) {
          toast.success("Member added successfully");
          setMemberForm({ userId: "", role: "" });
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to add member");
        }
      } catch (error) {
        toast.error("An error occurred while adding member");
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedProject) return;

    startTransition(async () => {
      try {
        const result = await removeProjectMember(memberId);

        if (result.success) {
          toast.success("Member removed successfully");
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to remove member");
        }
      } catch (error) {
        toast.error("An error occurred while removing member");
      }
    });
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setEditForm({
      name: project.name,
      description: project.description || "",
      businessCase: project.businessCase || "",
      clusterId: project.cluster.id,
      budget: project.budget?.toString() || "",
      duration: project.duration?.toString() || "",
      technologyReadiness: project.technologyReadiness || "",
      ipPotential: project.ipPotential || "",
      startDate: project.startDate
        ? project.startDate.toISOString().split("T")[0]
        : "",
      endDate: project.endDate
        ? project.endDate.toISOString().split("T")[0]
        : "",
      status: project.status,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  const openMembersDialog = (project: Project) => {
    setSelectedProject(project);
    setShowMembersDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "ON_HOLD":
        return "bg-gray-100 text-gray-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "TERMINATED":
        return "bg-red-100 text-red-800";
      case "RED_FLAG":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "STAGE_0":
        return "bg-purple-100 text-purple-800";
      case "STAGE_1":
        return "bg-blue-100 text-blue-800";
      case "STAGE_2":
        return "bg-indigo-100 text-indigo-800";
      case "STAGE_3":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canEditThisProject = (project: Project) => {
    if (isAdmin) return true;
    if (isProjectLead && project.lead.id === selectedProject?.lead.id)
      return true;
    return canEditProject;
  };

  const canDeleteThisProject = (project: Project) => {
    if (isAdmin) return true;
    return canDeleteProject;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Management</h2>
          <p className="text-gray-600">Manage all projects and their details</p>
        </div>
        {canCreateProject && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <p className="text-sm text-gray-500">{project.projectId}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {canEditThisProject(project) && (
                      <DropdownMenuItem onClick={() => openEditDialog(project)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
                    )}
                    {canManageProjectMembers && (
                      <DropdownMenuItem
                        onClick={() => openMembersDialog(project)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Members
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canDeleteThisProject(project) && (
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(project)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace("_", " ")}
                  </Badge>
                  <Badge className={getStageColor(project.currentStage)}>
                    {project.currentStage.replace("STAGE_", "Stage ")}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {project.budget
                      ? `$${(project.budget / 1000000).toFixed(1)}M`
                      : "N/A"}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {project.duration ? `${project.duration}mo` : "N/A"}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Lead: {project.lead.name || project.lead.email}</span>
                  <span>Members: {project.members?.length || 0}</span>
                </div>

                {project._count && (
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {project._count.documents}
                    </div>
                    <div className="flex items-center">
                      <Flag className="h-3 w-3 mr-1" />
                      {project._count.redFlags}
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-3 w-3 mr-1" />
                      {project._count.milestones}
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {project._count.gateReviews}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first project.
            </p>
            {canCreateProject && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project with all the necessary details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="AI-Powered Analytics Platform"
                />
              </div>
              <div>
                <Label htmlFor="cluster">Cluster *</Label>
                <Select
                  value={createForm.clusterId}
                  onValueChange={(value) =>
                    setCreateForm({ ...createForm, clusterId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters.map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="Brief description of the project..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="businessCase">Business Case</Label>
              <Textarea
                id="businessCase"
                value={createForm.businessCase}
                onChange={(e) =>
                  setCreateForm({ ...createForm, businessCase: e.target.value })
                }
                placeholder="Detailed business case and justification..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={createForm.budget}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, budget: e.target.value })
                  }
                  placeholder="2500000"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (months)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={createForm.duration}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, duration: e.target.value })
                  }
                  placeholder="18"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="trl">Technology Readiness Level</Label>
                <Input
                  id="trl"
                  value={createForm.technologyReadiness}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      technologyReadiness: e.target.value,
                    })
                  }
                  placeholder="TRL 4"
                />
              </div>
              <div>
                <Label htmlFor="ip">IP Potential</Label>
                <Input
                  id="ip"
                  value={createForm.ipPotential}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      ipPotential: e.target.value,
                    })
                  }
                  placeholder="High - 3 patent applications planned"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName">Project Name *</Label>
                <Input
                  id="editName"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editCluster">Cluster</Label>
                <Select
                  value={editForm.clusterId}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, clusterId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters.map((cluster) => (
                      <SelectItem key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="editBusinessCase">Business Case</Label>
              <Textarea
                id="editBusinessCase"
                value={editForm.businessCase}
                onChange={(e) =>
                  setEditForm({ ...editForm, businessCase: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editBudget">Budget ($)</Label>
                <Input
                  id="editBudget"
                  type="number"
                  value={editForm.budget}
                  onChange={(e) =>
                    setEditForm({ ...editForm, budget: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editDuration">Duration (months)</Label>
                <Input
                  id="editDuration"
                  type="number"
                  value={editForm.duration}
                  onChange={(e) =>
                    setEditForm({ ...editForm, duration: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isPending}>
                {isPending ? "Updating..." : "Update Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProject?.name}"? This
              action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Project Members</DialogTitle>
            <DialogDescription>
              Add or remove team members for {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Member Form */}
            <div className="space-y-3">
              <h4 className="font-medium">Add New Member</h4>
              <div>
                <Label htmlFor="userId">User</Label>
                <Select
                  value={memberForm.userId}
                  onValueChange={(value) =>
                    setMemberForm({ ...memberForm, userId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={memberForm.role}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, role: e.target.value })
                  }
                  placeholder="e.g., Senior Researcher, Data Scientist"
                />
              </div>
              <Button
                onClick={handleAddMember}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Adding..." : "Add Member"}
              </Button>
            </div>

            {/* Current Members */}
            <div className="space-y-3">
              <h4 className="font-medium">Current Members</h4>
              {selectedProject?.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="font-medium">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {(!selectedProject?.members ||
                selectedProject.members.length === 0) && (
                <p className="text-gray-500 text-center py-4">
                  No members added yet
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
