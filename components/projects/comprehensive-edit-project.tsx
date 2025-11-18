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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Edit,
  Save,
  DollarSign,
  Users,
  Settings,
  Calendar,
  Target,
  Flag,
  FileText,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateProject,
  addProjectMember,
  removeProjectMember,
} from "@/actions/projects";

interface Project {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  businessCase?: string | null;
  currentStage: string;
  status: string;
  budget?: number | null;
  budgetUtilization?: number | null;
  duration?: number | null;
  technologyReadiness?: string | null;
  ipPotential?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  lead: {
    id: string;
    name: string | null;
    email: string | null;
  };
  cluster: {
    id: string;
    name: string;
  };
  members?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
    role: string;
  }[];
  _count?: {
    documents: number;
    redFlags: number;
    gateReviews: number;
    comments: number;
  };
}

interface Cluster {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface ComprehensiveEditProjectProps {
  project: Project;
  clusters: Cluster[];
  users: User[];
  currentUserId: string;
  currentUserRole: string;
  onSuccess?: () => void;
}

export function ComprehensiveEditProject({
  project,
  clusters,
  users,
  currentUserId,
  currentUserRole,
  onSuccess,
}: ComprehensiveEditProjectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("overview");

  // Check permissions
  const isAdmin = currentUserRole === "ADMIN";
  const isGatekeeper = currentUserRole === "GATEKEEPER";
  const isProjectLead = project.lead.id === currentUserId;
  const canEdit = isAdmin || isGatekeeper || isProjectLead;

  // Form states
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
    businessCase: project.businessCase || "",
    budget: project.budget || 0,
    budgetUtilization: project.budgetUtilization || 0,
    duration: project.duration || 0,
    technologyReadiness: project.technologyReadiness || "",
    ipPotential: project.ipPotential || "",
    startDate: project.startDate
      ? new Date(project.startDate).toISOString().split("T")[0]
      : "",
    endDate: project.endDate
      ? new Date(project.endDate).toISOString().split("T")[0]
      : "",
    clusterId: project.cluster.id,
    status: project.status,
    newLeadId: project.lead.id,
  });

  const [newMember, setNewMember] = useState({
    userId: "",
    role: "TEAM_MEMBER",
  });

  const handleSaveChanges = () => {
    startTransition(async () => {
      try {
        // Update project details
        const detailsResult = await updateProject(project.id, {
          name: formData.name,
          description: formData.description,
          businessCase: formData.businessCase,
          duration: formData.duration,
          technologyReadiness: formData.technologyReadiness,
          ipPotential: formData.ipPotential,
          startDate: formData.startDate
            ? new Date(formData.startDate)
            : undefined,
          endDate: formData.endDate ? new Date(formData.endDate) : undefined,
          clusterId: formData.clusterId,
        });

        if (!detailsResult.success) {
          toast.error(
            detailsResult.error || "Failed to update project details"
          );
          return;
        }

        // Update budget if changed
        if (
          formData.budget !== project.budget ||
          formData.budgetUtilization !== project.budgetUtilization
        ) {
          const budgetResult = await updateProject(project.id, {
            budget: formData.budget,
            budgetUtilization: formData.budgetUtilization,
          });

          if (!budgetResult.success) {
            toast.error(budgetResult.error || "Failed to update budget");
            return;
          }
        }

        // Update status if changed
        if (formData.status !== project.status) {
          const statusResult = await updateProject(project.id, {
            status: formData.status,
          });

          if (!statusResult.success) {
            toast.error(statusResult.error || "Failed to update status");
            return;
          }
        }

        // Transfer lead if changed
        if (formData.newLeadId !== project.lead.id) {
          const leadResult = await updateProject(project.id, {
            leadId: formData.newLeadId,
          });

          if (!leadResult.success) {
            toast.error(leadResult.error || "Failed to transfer leadership");
            return;
          }
        }

        toast.success("Project updated successfully");
        onSuccess?.();
        setIsOpen(false);
      } catch (error) {
        toast.error("An error occurred while updating the project");
      }
    });
  };

  const handleAddMember = () => {
    if (!newMember.userId) {
      toast.error("Please select a user to add");
      return;
    }

    startTransition(async () => {
      try {
        const result = await addProjectMember(
          project.id,
          newMember.userId,
          newMember.role
        );

        if (result.success) {
          toast.success("Team member added successfully");
          setNewMember({ userId: "", role: "TEAM_MEMBER" });
          onSuccess?.();
        } else {
          toast.error(result.error || "Failed to add team member");
        }
      } catch (error) {
        toast.error("An error occurred while adding team member");
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      try {
        const result = await removeProjectMember(memberId);

        if (result.success) {
          toast.success("Team member removed successfully");
          onSuccess?.();
        } else {
          toast.error(result.error || "Failed to remove team member");
        }
      } catch (error) {
        toast.error("An error occurred while removing team member");
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
      !project.members?.some((member) => member.user.id === user.id) &&
      user.id !== project.lead.id &&
      [
        "ADMIN",
        "GATEKEEPER",
        "PROJECT_LEAD",
        "RESEARCHER",
        "TEAM_MEMBER",
      ].includes(user.role)
  );

  const eligibleLeads = users.filter((user) =>
    ["ADMIN", "GATEKEEPER", "PROJECT_LEAD", "RESEARCHER"].includes(user.role)
  );

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit Project: {project.name}</span>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace("_", " ")}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <Settings className="h-4 w-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-1" />
              Details
            </TabsTrigger>
            <TabsTrigger value="budget">
              <DollarSign className="h-4 w-4 mr-1" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-1" />
              Team
            </TabsTrigger>
            <TabsTrigger value="status">
              <Activity className="h-4 w-4 mr-1" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Project Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {project.projectId}
                  </div>
                  <div>
                    <span className="font-medium">Stage:</span>{" "}
                    {project.currentStage.replace("STAGE_", "Stage ")}
                  </div>
                  <div>
                    <span className="font-medium">Lead:</span>{" "}
                    {project.lead.name}
                  </div>
                  <div>
                    <span className="font-medium">Cluster:</span>{" "}
                    {project.cluster.name}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Total:</span> R
                    {(project.budget || 0).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Utilized:</span>{" "}
                    {project.budgetUtilization || 0}%
                  </div>
                  <div>
                    <span className="font-medium">Spent:</span> R
                    {(
                      ((project.budget || 0) *
                        (project.budgetUtilization || 0)) /
                      100
                    ).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Remaining:</span> R
                    {(
                      (project.budget || 0) -
                      ((project.budget || 0) *
                        (project.budgetUtilization || 0)) /
                        100
                    ).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Documents:</span>{" "}
                    {project._count?.documents || 0}
                  </div>
                  <div>
                    <span className="font-medium">Red Flags:</span>{" "}
                    {project._count?.redFlags || 0}
                  </div>
                  <div>
                    <span className="font-medium">Gate Reviews:</span>{" "}
                    {project._count?.gateReviews || 0}
                  </div>
                  <div>
                    <span className="font-medium">Team Size:</span>{" "}
                    {(project.members?.length || 0) + 1}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Edit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quickName">Project Name</Label>
                    <Input
                      id="quickName"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="quickStatus">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PENDING_REVIEW">
                          Pending Review
                        </SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cluster">Cluster</Label>
                    <Select
                      value={formData.clusterId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, clusterId: value })
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="businessCase">Business Case</Label>
                  <Textarea
                    id="businessCase"
                    value={formData.businessCase}
                    onChange={(e) =>
                      setFormData({ ...formData, businessCase: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (months)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="trl">Technology Readiness</Label>
                    <Select
                      value={formData.technologyReadiness}
                      onValueChange={(value) =>
                        setFormData({ ...formData, technologyReadiness: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select TRL" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 9 }, (_, i) => (
                          <SelectItem key={i + 1} value={`TRL-${i + 1}`}>
                            TRL-{i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ip">IP Potential</Label>
                    <Select
                      value={formData.ipPotential}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ipPotential: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select IP potential" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Very High">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Total Budget (R)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          budget: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="utilization">Utilization (%)</Label>
                    <Input
                      id="utilization"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.budgetUtilization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          budgetUtilization: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-2">Budget Calculation</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Budget:</span>
                      <span>R{formData.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilization:</span>
                      <span>{formData.budgetUtilization}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent Amount:</span>
                      <span>
                        R
                        {(
                          (formData.budget * formData.budgetUtilization) /
                          100
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Remaining:</span>
                      <span>
                        R
                        {(
                          formData.budget -
                          (formData.budget * formData.budgetUtilization) / 100
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {formData.budgetUtilization > 90 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">
                        High Budget Utilization
                      </h4>
                      <p className="text-sm text-red-700">
                        Budget utilization is above 90%. Consider reviewing
                        spending or requesting additional funds.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Project Lead</h4>
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <span className="font-medium">{project.lead.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({project.lead.email})
                      </span>
                    </div>
                    <Badge variant="outline">Lead</Badge>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="newLead">Transfer Leadership</Label>
                    <Select
                      value={formData.newLeadId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, newLeadId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleLeads.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email}) - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Team Members</h4>
                  {project.members && project.members.length > 0 ? (
                    <div className="space-y-2">
                      {project.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <span className="font-medium">
                              {member.user.name}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({member.user.email})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{member.role}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={isPending}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No team members added yet.
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Add Team Member</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newUser">Select User</Label>
                      <Select
                        value={newMember.userId}
                        onValueChange={(value) =>
                          setNewMember({ ...newMember, userId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose user" />
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
                      <Label htmlFor="newRole">Role</Label>
                      <Select
                        value={newMember.role}
                        onValueChange={(value) =>
                          setNewMember({ ...newMember, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEAM_MEMBER">
                            Team Member
                          </SelectItem>
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
                  </div>
                  <Button
                    onClick={handleAddMember}
                    disabled={isPending || !newMember.userId}
                    className="mt-2"
                  >
                    Add Member
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span>Current Status:</span>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>

                <div>
                  <Label htmlFor="status">Update Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING_REVIEW">
                        Pending Review
                      </SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-gray-50 border rounded-lg">
                  <h4 className="font-medium mb-2">Status Descriptions</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Active:</strong> Project is actively being worked
                      on
                    </div>
                    <div>
                      <strong>Pending Review:</strong> Awaiting gate review or
                      approval
                    </div>
                    <div>
                      <strong>On Hold:</strong> Temporarily paused
                    </div>
                    <div>
                      <strong>Completed:</strong> Project has been successfully
                      finished
                    </div>
                    <div>
                      <strong>Terminated:</strong> Project has been cancelled or
                      stopped
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
