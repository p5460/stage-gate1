"use client";

import { useState, useTransition } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { uploadDocument } from "@/actions/documents";
import { toast } from "sonner";

interface UploadDocumentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function UploadDocumentForm({
  open,
  onOpenChange,
  projectId,
}: UploadDocumentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "OTHER",
    isRequired: false,
    version: "1.0",
    file: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.file) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      const submitData = new FormData();
      submitData.append("projectId", projectId);
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("type", formData.type);
      submitData.append("isRequired", formData.isRequired.toString());
      submitData.append("version", formData.version);
      if (formData.file) {
        submitData.append("file", formData.file);
      }

      const result = await uploadDocument(submitData);

      if (result.success) {
        toast.success("Document uploaded successfully!");
        setFormData({
          name: "",
          description: "",
          type: "OTHER",
          isRequired: false,
          version: "1.0",
          file: null,
        });
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    });
  };

  const documentTypes = [
    { value: "BUSINESS_CASE", label: "Business Case" },
    { value: "RESEARCH_PLAN", label: "Research Plan" },
    { value: "TECHNICAL_SPEC", label: "Technical Specification" },
    { value: "RISK_ASSESSMENT", label: "Risk Assessment" },
    { value: "BUDGET_PLAN", label: "Budget Plan" },
    { value: "MILESTONE_REPORT", label: "Milestone Report" },
    { value: "FINAL_REPORT", label: "Final Report" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Document Name *</Label>
            <Input
              id="name"
              placeholder="Business Case v1.0"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Document Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the document"
              className="min-h-[80px]"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="1.0"
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="required"
                checked={formData.isRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRequired: checked })
                }
              />
              <Label htmlFor="required" className="text-sm">
                Required
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) =>
                setFormData({ ...formData, file: e.target.files?.[0] || null })
              }
              required
            />
            <p className="text-xs text-gray-500">
              Supported formats: PDF, Word, Excel, PowerPoint (Max 10MB)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
