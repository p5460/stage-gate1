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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  downloadTemplate,
} from "@/actions/templates";

interface Template {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  stage?: string | null;
  fileUrl: string;
  fileName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateManagementProps {
  templates: Template[];
  canManageTemplates: boolean;
  onUpdate?: () => void;
}

export function TemplateManagement({
  templates,
  canManageTemplates,
  onUpdate,
}: TemplateManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  // Form states
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    type: "",
    stage: "",
    file: null as File | null,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    type: "",
    stage: "",
    isActive: true,
  });

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description &&
        template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType =
      selectedType === "all" || template.type === selectedType;
    const matchesStage =
      selectedStage === "all" || template.stage === selectedStage;

    return matchesSearch && matchesType && matchesStage;
  });

  const handleUpload = () => {
    if (!uploadForm.name || !uploadForm.type || !uploadForm.file) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", uploadForm.name);
        formData.append("description", uploadForm.description);
        formData.append("type", uploadForm.type);
        formData.append("stage", uploadForm.stage);
        if (uploadForm.file) {
          formData.append("file", uploadForm.file);
        }

        const result = await createTemplate(formData);

        if (result.success) {
          toast.success("Template uploaded successfully");
          setShowUploadDialog(false);
          setUploadForm({
            name: "",
            description: "",
            type: "",
            stage: "",
            file: null,
          });
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to upload template");
        }
      } catch (error) {
        toast.error("An error occurred while uploading template");
      }
    });
  };

  const handleEdit = () => {
    if (!selectedTemplate) return;

    startTransition(async () => {
      try {
        const result = await updateTemplate(selectedTemplate.id, editForm);

        if (result.success) {
          toast.success("Template updated successfully");
          setShowEditDialog(false);
          setSelectedTemplate(null);
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to update template");
        }
      } catch (error) {
        toast.error("An error occurred while updating template");
      }
    });
  };

  const handleDelete = () => {
    if (!selectedTemplate) return;

    startTransition(async () => {
      try {
        const result = await deleteTemplate(selectedTemplate.id);

        if (result.success) {
          toast.success("Template deleted successfully");
          setShowDeleteDialog(false);
          setSelectedTemplate(null);
          onUpdate?.();
        } else {
          toast.error(result.error || "Failed to delete template");
        }
      } catch (error) {
        toast.error("An error occurred while deleting template");
      }
    });
  };

  const handleDownload = async (template: Template) => {
    startTransition(async () => {
      try {
        const result = await downloadTemplate(template.id);

        if (result.success && result.template) {
          // Create download link
          const link = document.createElement("a");
          link.href = result.template.fileUrl;
          link.download = result.template.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(`${template.name} downloaded successfully`);
        } else {
          toast.error(result.error || "Failed to download template");
        }
      } catch (error) {
        toast.error("An error occurred while downloading template");
      }
    });
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || "",
      type: template.type,
      stage: template.stage || "",
      isActive: template.isActive,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (template: Template) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUSINESS_CASE":
        return "💼";
      case "RESEARCH_PLAN":
        return "🔬";
      case "TECHNICAL_SPEC":
        return "⚙️";
      case "RISK_ASSESSMENT":
        return "⚠️";
      case "BUDGET_PLAN":
        return "💰";
      case "MILESTONE_REPORT":
        return "📊";
      case "FINAL_REPORT":
        return "📋";
      default:
        return "📄";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "BUSINESS_CASE":
        return "bg-blue-100 text-blue-800";
      case "RESEARCH_PLAN":
        return "bg-green-100 text-green-800";
      case "TECHNICAL_SPEC":
        return "bg-purple-100 text-purple-800";
      case "RISK_ASSESSMENT":
        return "bg-red-100 text-red-800";
      case "BUDGET_PLAN":
        return "bg-yellow-100 text-yellow-800";
      case "MILESTONE_REPORT":
        return "bg-indigo-100 text-indigo-800";
      case "FINAL_REPORT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTypeName = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const documentTypes = [
    "BUSINESS_CASE",
    "RESEARCH_PLAN",
    "TECHNICAL_SPEC",
    "RISK_ASSESSMENT",
    "BUDGET_PLAN",
    "MILESTONE_REPORT",
    "FINAL_REPORT",
    "OTHER",
  ];

  const projectStages = ["STAGE_0", "STAGE_1", "STAGE_2", "STAGE_3"];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Template Management</h2>
          <p className="text-gray-600">
            Upload, edit, and manage document templates
          </p>
        </div>
        {canManageTemplates && (
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Template
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {documentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {formatTypeName(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {projectStages.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage.replace("STAGE_", "Stage ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTypeIcon(template.type)}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-500">{template.fileName}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload(template)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    {canManageTemplates && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(template)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {template.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <Badge className={getTypeColor(template.type)}>
                  {formatTypeName(template.type)}
                </Badge>
                {template.stage && (
                  <Badge variant="outline">
                    {template.stage.replace("STAGE_", "Stage ")}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Updated: {new Date(template.updatedAt).toLocaleDateString()}
                </span>
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedType !== "all" || selectedStage !== "all"
                ? "No templates match your current filters."
                : "No templates have been uploaded yet."}
            </p>
            {canManageTemplates && (
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Template Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Template</DialogTitle>
            <DialogDescription>
              Upload a new document template for projects
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, name: e.target.value })
                }
                placeholder="Business Case Template"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
                placeholder="Template description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Document Type *</Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value) =>
                    setUploadForm({ ...uploadForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatTypeName(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stage">Project Stage</Label>
                <Select
                  value={uploadForm.stage}
                  onValueChange={(value) =>
                    setUploadForm({
                      ...uploadForm,
                      stage: value === "all" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {projectStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage.replace("STAGE_", "Stage ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="file">Template File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    file: e.target.files?.[0] || null,
                  })
                }
                accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isPending}>
                {isPending ? "Uploading..." : "Upload Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template information and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Template Name *</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editType">Document Type *</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatTypeName(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editStage">Project Stage</Label>
                <Select
                  value={editForm.stage}
                  onValueChange={(value) =>
                    setEditForm({
                      ...editForm,
                      stage: value === "all" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {projectStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage.replace("STAGE_", "Stage ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editActive"
                checked={editForm.isActive}
                onChange={(e) =>
                  setEditForm({ ...editForm, isActive: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="editActive">Template is active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isPending}>
                {isPending ? "Updating..." : "Update Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
