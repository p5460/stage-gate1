"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  X,
  Upload,
  Users,
  FileText,
  Calendar,
  Target,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Building,
  Download,
  Trash2,
  Edit,
  Flag,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateProject,
  addProjectMember,
  removeProjectMember,
} from "@/actions/projects";
import { uploadDocument, deleteDocument } from "@/actions/documents";
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/actions/milestones";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  position: string | null;
}

interface Cluster {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user: User;
}

interface ProjectDocument {
  id: string;
  name: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  isRequired: boolean;
  isApproved: boolean | null;
  version: string;
  createdAt: Date;
  uploader: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface ProjectMilestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  progress: number;
  isCompleted: boolean;
}

interface RedFlag {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  createdAt: Date;
  raisedBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  businessCase: string | null;
  currentStage: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | null;
  budgetUtilization: number | null;
  technologyReadiness: string | null;
  ipPotential: string | null;
  duration: number | null;
  clusterId: string;
  leadId: string;
  cluster: Cluster;
  lead: User;
  members: ProjectMember[];
  documents: ProjectDocument[];
  milestones: ProjectMilestone[];
  redFlags: RedFlag[];
}

interface EditProjectFormProps {
  project: Project;
  clusters: Cluster[];
  users: User[];
  currentUser: User;
}

interface NewDocument {
  name: string;
  description: string;
  type: string;
  file: File | null;
  isRequired: boolean;
}

interface NewMilestone {
  title: string;
  description: string;
  dueDate: string;
}

export function EditProjectForm({
  project,
  clusters,
  users,
  currentUser,
}: EditProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentTab, setCurrentTab] = useState("basic");

  // Basic project info
  const [projectData, setProjectData] = useState({
    name: project.name,
    description: project.description || "",
    businessCase: project.businessCase || "",
    clusterId: project.clusterId,
    budget: project.budget?.toString() || "",
    duration: project.duration?.toString() || "",
    technologyReadiness: project.technologyReadiness || "",
    ipPotential: project.ipPotential || "",
    startDate: project.startDate
      ? project.startDate.toISOString().split("T")[0]
      : "",
    endDate: project.endDate ? project.endDate.toISOString().split("T")[0] : "",
    status: project.status,
  });

  // Team members management
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState("");

  // Documents management
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [documentData, setDocumentData] = useState<NewDocument>({
    name: "",
    description: "",
    type: "BUSINESS_CASE",
    file: null as any,
    isRequired: false,
  });

  // Milestones management
  const [showAddMilestoneDialog, setShowAddMilestoneDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<ProjectMilestone | null>(null);
  const [milestoneData, setMilestoneData] = useState<NewMilestone>({
    title: "",
    description: "",
    dueDate: "",
  });

  const memberRoles = [
    "Researcher",
    "Technical Lead",
    "Business Analyst",
    "Quality Assurance",
    "Project Coordinator",
    "Subject Matter Expert",
    "Stakeholder",
  ];

  const documentTypes = [
    { value: "BUSINESS_CASE", label: "Business Case" },
    { value: "RESEARCH_PLAN", label: "Research Plan" },
    { value: "TECHNICAL_SPEC", label: "Technical Specification" },
    { value: "BUDGET_PLAN", label: "Budget Plan" },
    { value: "RISK_ASSESSMENT", label: "Risk Assessment" },
    { value: "MILESTONE_REPORT", label: "Milestone Report" },
    { value: "PRESENTATION", label: "Presentation" },
    { value: "OTHER", label: "Other" },
  ];

  const technologyReadinessLevels = [
    "TRL 1 - Basic principles observed",
    "TRL 2 - Technology concept formulated",
    "TRL 3 - Experimental proof of concept",
    "TRL 4 - Technology validated in lab",
    "TRL 5 - Technology validated in relevant environment",
    "TRL 6 - Technology demonstrated in relevant environment",
    "TRL 7 - System prototype demonstration",
    "TRL 8 - System complete and qualified",
    "TRL 9 - Actual system proven in operational environment",
  ];

  const ipPotentialLevels = [
    "High - Novel invention with strong patent potential",
    "Medium - Incremental innovation with some IP value",
    "Low - Limited novelty, minimal IP potential",
    "None - No intellectual property expected",
  ];

  const projectStatuses = [
    { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
    {
      value: "ON_HOLD",
      label: "On Hold",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "COMPLETED",
      label: "Completed",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "CANCELLED",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
    { value: "RED_FLAG", label: "Red Flag", color: "bg-red-100 text-red-800" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProject = async () => {
    startTransition(async () => {
      try {
        const updateData = {
          name: projectData.name,
          description: projectData.description,
          businessCase: projectData.businessCase,
          clusterId: projectData.clusterId,
          budget: projectData.budget
            ? parseFloat(projectData.budget)
            : undefined,
          duration: projectData.duration
            ? parseInt(projectData.duration)
            : undefined,
          technologyReadiness: projectData.technologyReadiness,
          ipPotential: projectData.ipPotential,
          startDate: projectData.startDate
            ? new Date(projectData.startDate)
            : undefined,
          endDate: projectData.endDate
            ? new Date(projectData.endDate)
            : undefined,
          status: projectData.status,
        };

        const result = await updateProject(project.id, updateData);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Project updated successfully");
        }
      } catch (error) {
        console.error("Error updating project:", error);
        toast.error("Failed to update project");
      }
    });
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !memberRole) {
      toast.error("Please select a user and role");
      return;
    }

    if (project.members.some((m) => m.userId === selectedUserId)) {
      toast.error("User is already a member of this project");
      return;
    }

    startTransition(async () => {
      try {
        const result = await addProjectMember(
          project.id,
          selectedUserId,
          memberRole
        );

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Team member added successfully");
          setSelectedUserId("");
          setMemberRole("");
          setShowAddMemberDialog(false);
          router.refresh();
        }
      } catch (error) {
        console.error("Error adding member:", error);
        toast.error("Failed to add team member");
      }
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    startTransition(async () => {
      try {
        const result = await removeProjectMember(memberId);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Team member removed successfully");
          router.refresh();
        }
      } catch (error) {
        console.error("Error removing member:", error);
        toast.error("Failed to remove team member");
      }
    });
  };

  const handleAddDocument = async () => {
    if (!documentData.name || !documentData.file) {
      toast.error("Please provide document name and file");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("projectId", project.id);
        formData.append("name", documentData.name);
        formData.append("description", documentData.description);
        formData.append("type", documentData.type);
        if (documentData.file) {
          formData.append("file", documentData.file);
        }
        formData.append("isRequired", documentData.isRequired.toString());

        const result = await uploadDocument(formData);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Document uploaded successfully");
          setDocumentData({
            name: "",
            description: "",
            type: "BUSINESS_CASE",
            file: null as any,
            isRequired: false,
          });
          setShowAddDocumentDialog(false);
          router.refresh();
        }
      } catch (error) {
        console.error("Error uploading document:", error);
        toast.error("Failed to upload document");
      }
    });
  };

  const handleDeleteDocument = async (documentId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteDocument(documentId);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Document deleted successfully");
          router.refresh();
        }
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Failed to delete document");
      }
    });
  };

  const handleAddMilestone = async () => {
    if (!milestoneData.title || !milestoneData.dueDate) {
      toast.error("Please provide milestone title and due date");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createMilestone(
          project.id,
          milestoneData.title,
          milestoneData.description,
          new Date(milestoneData.dueDate)
        );

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Milestone created successfully");
          setMilestoneData({
            title: "",
            description: "",
            dueDate: "",
          });
          setShowAddMilestoneDialog(false);
          router.refresh();
        }
      } catch (error) {
        console.error("Error creating milestone:", error);
        toast.error("Failed to create milestone");
      }
    });
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !milestoneData.title || !milestoneData.dueDate) {
      toast.error("Please provide milestone title and due date");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateMilestone(editingMilestone.id, {
          title: milestoneData.title,
          description: milestoneData.description,
          dueDate: new Date(milestoneData.dueDate),
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Milestone updated successfully");
          setEditingMilestone(null);
          setMilestoneData({
            title: "",
            description: "",
            dueDate: "",
          });
          setShowAddMilestoneDialog(false);
          router.refresh();
        }
      } catch (error) {
        console.error("Error updating milestone:", error);
        toast.error("Failed to update milestone");
      }
    });
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteMilestone(milestoneId);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Milestone deleted successfully");
          router.refresh();
        }
      } catch (error) {
        console.error("Error deleting milestone:", error);
        toast.error("Failed to delete milestone");
      }
    });
  };

  const openEditMilestone = (milestone: ProjectMilestone) => {
    setEditingMilestone(milestone);
    setMilestoneData({
      title: milestone.title,
      description: milestone.description || "",
      dueDate: milestone.dueDate.toISOString().split("T")[0],
    });
    setShowAddMilestoneDialog(true);
  };

  const resetMilestoneForm = () => {
    setEditingMilestone(null);
    setMilestoneData({
      title: "",
      description: "",
      dueDate: "",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const statusConfig = projectStatuses.find((s) => s.value === status);
    return statusConfig?.color || "bg-gray-100 text-gray-800";
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team ({project.members.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Documents ({project.documents.length})
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Milestones ({project.milestones.length})
          </TabsTrigger>
          <TabsTrigger value="flags" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Red Flags ({project.redFlags.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Information
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusBadgeColor(projectData.status)}>
                    {
                      projectStatuses.find(
                        (s) => s.value === projectData.status
                      )?.label
                    }
                  </Badge>
                  <Badge variant="outline">
                    {project.currentStage.replace("STAGE_", "Stage ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={projectData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cluster">Cluster *</Label>
                  <Select
                    value={projectData.clusterId}
                    onValueChange={(value) =>
                      handleInputChange("clusterId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cluster" />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters.map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          <div className="flex items-center gap-2">
                            {cluster.color && (
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cluster.color }}
                              />
                            )}
                            {cluster.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Project Status</Label>
                <Select
                  value={projectData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${status.color.split(" ")[0]}`}
                          />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe the project objectives, scope, and expected outcomes"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessCase">Business Case</Label>
                <Textarea
                  id="businessCase"
                  value={projectData.businessCase}
                  onChange={(e) =>
                    handleInputChange("businessCase", e.target.value)
                  }
                  placeholder="Describe the business justification, market opportunity, and expected benefits"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (ZAR)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="budget"
                      type="number"
                      value={projectData.budget}
                      onChange={(e) =>
                        handleInputChange("budget", e.target.value)
                      }
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (months)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="duration"
                      type="number"
                      value={projectData.duration}
                      onChange={(e) =>
                        handleInputChange("duration", e.target.value)
                      }
                      placeholder="12"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={projectData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={projectData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technologyReadiness">
                  Technology Readiness Level
                </Label>
                <Select
                  value={projectData.technologyReadiness}
                  onValueChange={(value) =>
                    handleInputChange("technologyReadiness", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select TRL level" />
                  </SelectTrigger>
                  <SelectContent>
                    {technologyReadinessLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipPotential">
                  Intellectual Property Potential
                </Label>
                <Select
                  value={projectData.ipPotential}
                  onValueChange={(value) =>
                    handleInputChange("ipPotential", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select IP potential" />
                  </SelectTrigger>
                  <SelectContent>
                    {ipPotentialLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpdateProject} disabled={isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <Dialog
                  open={showAddMemberDialog}
                  onOpenChange={setShowAddMemberDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>
                        Select a user and assign them a role in the project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>User</Label>
                        <Select
                          value={selectedUserId}
                          onValueChange={setSelectedUserId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter(
                                (user) =>
                                  !project.members.some(
                                    (m) => m.userId === user.id
                                  )
                              )
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <div>
                                      <div className="font-medium">
                                        {user.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={memberRole}
                          onValueChange={setMemberRole}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {memberRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddMemberDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddMember} disabled={isPending}>
                          {isPending ? "Adding..." : "Add Member"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Project Lead */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Project Lead</h4>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{project.lead.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {project.lead.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="default">Project Lead</Badge>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Team Members</h4>
                {project.members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No team members added yet</p>
                    <p className="text-sm">
                      Add team members to collaborate on this project
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {project.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.user.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.user.email}
                              </span>
                              {member.user.department && (
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {member.user.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{member.role}</Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <X className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Team Member
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  {member.user.name} from this project? This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Project Documents
                </CardTitle>
                <Dialog
                  open={showAddDocumentDialog}
                  onOpenChange={setShowAddDocumentDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Project Document</DialogTitle>
                      <DialogDescription>
                        Upload a new document for this project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Document Name *</Label>
                        <Input
                          value={documentData.name}
                          onChange={(e) =>
                            setDocumentData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Enter document name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={documentData.description}
                          onChange={(e) =>
                            setDocumentData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Describe the document content and purpose"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Document Type</Label>
                        <Select
                          value={documentData.type}
                          onValueChange={(value) =>
                            setDocumentData((prev) => ({
                              ...prev,
                              type: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>File *</Label>
                        <Input
                          type="file"
                          onChange={(e) =>
                            setDocumentData((prev) => ({
                              ...prev,
                              file: e.target.files?.[0] || null,
                            }))
                          }
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="required"
                          checked={documentData.isRequired}
                          onCheckedChange={(checked) =>
                            setDocumentData((prev) => ({
                              ...prev,
                              isRequired: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="required">Required document</Label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddDocumentDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddDocument}
                          disabled={isPending}
                        >
                          {isPending ? "Uploading..." : "Upload Document"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {project.documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">
                    Upload project documents, plans, and specifications
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{doc.name}</div>
                          {doc.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {doc.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
                            <span>{doc.fileName}</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>v{doc.version}</span>
                            <span>Uploaded by {doc.uploader.name}</span>
                            <span>
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {
                            documentTypes.find((t) => t.value === doc.type)
                              ?.label
                          }
                        </Badge>
                        {doc.isRequired && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                        {doc.isApproved === true && (
                          <Badge className="bg-green-100 text-green-800">
                            Approved
                          </Badge>
                        )}
                        {doc.isApproved === false && (
                          <Badge className="bg-red-100 text-red-800">
                            Rejected
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Document
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{doc.name}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Project Milestones
                </CardTitle>
                <Dialog
                  open={showAddMilestoneDialog}
                  onOpenChange={(open) => {
                    setShowAddMilestoneDialog(open);
                    if (!open) resetMilestoneForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingMilestone ? "Edit Milestone" : "Add Milestone"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingMilestone
                          ? "Update the milestone details"
                          : "Create a new milestone for this project"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Milestone Title *</Label>
                        <Input
                          value={milestoneData.title}
                          onChange={(e) =>
                            setMilestoneData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Enter milestone title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={milestoneData.description}
                          onChange={(e) =>
                            setMilestoneData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Describe the milestone objectives and success criteria"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Due Date *</Label>
                        <Input
                          type="date"
                          value={milestoneData.dueDate}
                          onChange={(e) =>
                            setMilestoneData((prev) => ({
                              ...prev,
                              dueDate: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddMilestoneDialog(false);
                            resetMilestoneForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={
                            editingMilestone
                              ? handleUpdateMilestone
                              : handleAddMilestone
                          }
                          disabled={isPending}
                        >
                          {isPending
                            ? editingMilestone
                              ? "Updating..."
                              : "Creating..."
                            : editingMilestone
                              ? "Update Milestone"
                              : "Create Milestone"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {project.milestones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No milestones created yet</p>
                  <p className="text-sm">
                    Add project milestones to track progress and deliverables
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            milestone.isCompleted
                              ? "bg-green-100"
                              : new Date(milestone.dueDate) < new Date()
                                ? "bg-red-100"
                                : "bg-blue-100"
                          }`}
                        >
                          <Target
                            className={`h-4 w-4 ${
                              milestone.isCompleted
                                ? "text-green-600"
                                : new Date(milestone.dueDate) < new Date()
                                  ? "text-red-600"
                                  : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{milestone.title}</div>
                          {milestone.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {milestone.description}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 mt-2 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due:{" "}
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </span>
                            <span>Progress: {milestone.progress}%</span>
                            {milestone.isCompleted && (
                              <Badge className="bg-green-100 text-green-800">
                                Completed
                              </Badge>
                            )}
                            {!milestone.isCompleted &&
                              new Date(milestone.dueDate) < new Date() && (
                                <Badge className="bg-red-100 text-red-800">
                                  Overdue
                                </Badge>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditMilestone(milestone)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Milestone
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {milestone.title}"? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteMilestone(milestone.id)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Red Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.redFlags.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Flag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No red flags raised</p>
                  <p className="text-sm">
                    Red flags will appear here when issues are identified
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.redFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="flex items-start justify-between p-4 border rounded-lg border-red-200 bg-red-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <Flag className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-red-900">
                            {flag.title}
                          </div>
                          {flag.description && (
                            <div className="text-sm text-red-700 mt-1">
                              {flag.description}
                            </div>
                          )}
                          <div className="text-xs text-red-600 mt-2 flex items-center gap-4">
                            <span>Raised by {flag.raisedBy.name}</span>
                            <span>
                              {new Date(flag.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            flag.severity === "CRITICAL"
                              ? "bg-red-600 text-white"
                              : flag.severity === "HIGH"
                                ? "bg-red-500 text-white"
                                : flag.severity === "MEDIUM"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-blue-500 text-white"
                          }
                        >
                          {flag.severity}
                        </Badge>
                        <Badge variant="outline">{flag.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            Cancel
          </Button>
          <Button onClick={() => router.push(`/projects/${project.id}`)}>
            Done Editing
          </Button>
        </div>
      </div>
    </div>
  );
}
