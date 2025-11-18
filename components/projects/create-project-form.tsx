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
} from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/actions/projects";
import { addProjectMember } from "@/actions/projects";
import { uploadDocument } from "@/actions/documents";
import { createMilestone } from "@/actions/milestones";

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

interface CreateProjectFormProps {
  clusters: Cluster[];
  users: User[];
  currentUser: User;
}

interface ProjectMember {
  userId: string;
  role: string;
  user: User;
}

interface ProjectDocument {
  name: string;
  description: string;
  type: string;
  file: File;
  isRequired: boolean;
}

interface ProjectMilestone {
  title: string;
  description: string;
  dueDate: string;
  deliverables: string[];
}

export function CreateProjectForm({
  clusters,
  users,
  currentUser,
}: CreateProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentTab, setCurrentTab] = useState("basic");

  // Basic project info
  const [projectData, setProjectData] = useState({
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

  // Team members
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState("");

  // Documents
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = useState(false);
  const [documentData, setDocumentData] = useState({
    name: "",
    description: "",
    type: "BUSINESS_CASE",
    file: null as File | null,
    isRequired: false,
  });

  // Milestones
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [showAddMilestoneDialog, setShowAddMilestoneDialog] = useState(false);
  const [milestoneData, setMilestoneData] = useState({
    title: "",
    description: "",
    dueDate: "",
    deliverables: [""],
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

  const handleInputChange = (field: string, value: string) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
  };

  const addTeamMember = () => {
    if (!selectedUserId || !memberRole) {
      toast.error("Please select a user and role");
      return;
    }

    const user = users.find((u) => u.id === selectedUserId);
    if (!user) return;

    if (teamMembers.some((m) => m.userId === selectedUserId)) {
      toast.error("User is already added to the team");
      return;
    }

    setTeamMembers((prev) => [
      ...prev,
      {
        userId: selectedUserId,
        role: memberRole,
        user,
      },
    ]);

    setSelectedUserId("");
    setMemberRole("");
    setShowAddMemberDialog(false);
    toast.success("Team member added");
  };

  const removeTeamMember = (userId: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.userId !== userId));
    toast.success("Team member removed");
  };

  const addDocument = () => {
    if (!documentData.name || !documentData.file) {
      toast.error("Please provide document name and file");
      return;
    }

    setDocuments((prev) => [
      ...prev,
      {
        name: documentData.name,
        description: documentData.description,
        type: documentData.type,
        file: documentData.file!,
        isRequired: documentData.isRequired,
      },
    ]);

    setDocumentData({
      name: "",
      description: "",
      type: "BUSINESS_CASE",
      file: null,
      isRequired: false,
    });
    setShowAddDocumentDialog(false);
    toast.success("Document added");
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
    toast.success("Document removed");
  };

  const addMilestone = () => {
    if (!milestoneData.title || !milestoneData.dueDate) {
      toast.error("Please provide milestone title and due date");
      return;
    }

    setMilestones((prev) => [
      ...prev,
      {
        title: milestoneData.title,
        description: milestoneData.description,
        dueDate: milestoneData.dueDate,
        deliverables: milestoneData.deliverables.filter((d) => d.trim() !== ""),
      },
    ]);

    setMilestoneData({
      title: "",
      description: "",
      dueDate: "",
      deliverables: [""],
    });
    setShowAddMilestoneDialog(false);
    toast.success("Milestone added");
  };

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
    toast.success("Milestone removed");
  };

  const addDeliverable = () => {
    setMilestoneData((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, ""],
    }));
  };

  const updateDeliverable = (index: number, value: string) => {
    setMilestoneData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => (i === index ? value : d)),
    }));
  };

  const removeDeliverable = (index: number) => {
    setMilestoneData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const validateBasicInfo = () => {
    if (
      !projectData.name ||
      !projectData.description ||
      !projectData.clusterId
    ) {
      toast.error("Please fill in all required basic information");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateBasicInfo()) return;

    startTransition(async () => {
      try {
        // Create the project
        const formData = new FormData();
        Object.entries(projectData).forEach(([key, value]) => {
          formData.append(key, value);
        });

        const projectResult = await createProject(formData);

        if (projectResult.error) {
          toast.error(projectResult.error);
          return;
        }

        const projectId = projectResult.projectId!;

        // Add team members
        for (const member of teamMembers) {
          await addProjectMember(projectId, member.userId, member.role);
        }

        // Upload documents
        for (const doc of documents) {
          const docFormData = new FormData();
          docFormData.append("projectId", projectId);
          docFormData.append("name", doc.name);
          docFormData.append("description", doc.description);
          docFormData.append("type", doc.type);
          docFormData.append("file", doc.file);
          docFormData.append("isRequired", doc.isRequired.toString());

          await uploadDocument(docFormData);
        }

        // Create milestones
        for (const milestone of milestones) {
          await createMilestone(
            projectId,
            milestone.title,
            milestone.description,
            new Date(milestone.dueDate)
          );
        }

        toast.success("Project created successfully!");
        router.push(`/projects/${projectId}`);
      } catch (error) {
        console.error("Error creating project:", error);
        toast.error("Failed to create project");
      }
    });
  };

  const isFormValid = () => {
    return projectData.name && projectData.description && projectData.clusterId;
  };

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Milestones ({milestones.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Information
              </CardTitle>
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
                            {users.map((user) => (
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
                        <Button onClick={addTeamMember}>Add Member</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No team members added yet</p>
                  <p className="text-sm">
                    Add team members to collaborate on this project
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{member.user.name}</div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(member.userId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      Add Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Project Document</DialogTitle>
                      <DialogDescription>
                        Upload a document that will be associated with this
                        project
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
                        <Button onClick={addDocument}>Add Document</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents added yet</p>
                  <p className="text-sm">
                    Add project documents, plans, and specifications
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <FileText className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-gray-500">
                            {doc.description || "No description"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {doc.file.name} (
                            {(doc.file.size / 1024 / 1024).toFixed(2)} MB)
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
                  onOpenChange={setShowAddMilestoneDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Project Milestone</DialogTitle>
                      <DialogDescription>
                        Define a key milestone with deliverables and timeline
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

                      <div className="space-y-2">
                        <Label>Deliverables</Label>
                        <div className="space-y-2">
                          {milestoneData.deliverables.map(
                            (deliverable, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={deliverable}
                                  onChange={(e) =>
                                    updateDeliverable(index, e.target.value)
                                  }
                                  placeholder="Enter deliverable"
                                />
                                {milestoneData.deliverables.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDeliverable(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addDeliverable}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Deliverable
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddMilestoneDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={addMilestone}>Add Milestone</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No milestones added yet</p>
                  <p className="text-sm">
                    Add project milestones to track progress and deliverables
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Target className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{milestone.title}</div>
                          {milestone.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {milestone.description}
                            </div>
                          )}
                          <div className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due:{" "}
                            {new Date(milestone.dueDate).toLocaleDateString()}
                          </div>
                          {milestone.deliverables.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Deliverables:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {milestone.deliverables.map(
                                  (deliverable, dIndex) => (
                                    <Badge
                                      key={dIndex}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {deliverable}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {isFormValid() ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Ready to create project
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Please complete required fields
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/projects")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid() || isPending}>
            {isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
