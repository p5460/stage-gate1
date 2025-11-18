"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

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

interface TemplateStats {
  type: string;
  _count: number;
}

interface TemplatesClientProps {
  templates: Template[];
  templateStats: TemplateStats[];
  canManageTemplates: boolean;
}

export function TemplatesClient({
  templates,
  templateStats,
  canManageTemplates,
}: TemplatesClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.type === selectedCategory)
    : templates;

  const handleDownload = async (template: Template) => {
    try {
      toast.info(`Downloading ${template.name}...`);

      // In a real implementation, you would handle the download
      // For now, we'll just open the file URL
      window.open(template.fileUrl, "_blank");

      toast.success(`${template.name} downloaded successfully`);
    } catch (error) {
      toast.error("Failed to download template");
    }
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

  return (
    <div className="space-y-6">
      {/* Template Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Template Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={`text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedCategory === null ? "bg-blue-50 border-blue-200" : ""
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              <div className="text-2xl mb-2">📁</div>
              <p className="font-medium text-gray-900">All Templates</p>
              <p className="text-sm text-gray-500">
                {templates.length} templates
              </p>
            </div>
            <div
              className={`text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedCategory === "STAGE_0"
                  ? "bg-blue-50 border-blue-200"
                  : ""
              }`}
              onClick={() => setSelectedCategory("STAGE_0")}
            >
              <div className="text-2xl mb-2">💡</div>
              <p className="font-medium text-gray-900">Stage 0</p>
              <p className="text-sm text-gray-500">Concept</p>
            </div>
            <div
              className={`text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedCategory === "STAGE_1"
                  ? "bg-blue-50 border-blue-200"
                  : ""
              }`}
              onClick={() => setSelectedCategory("STAGE_1")}
            >
              <div className="text-2xl mb-2">🔍</div>
              <p className="font-medium text-gray-900">Stage 1</p>
              <p className="text-sm text-gray-500">Research Planning</p>
            </div>
            <div
              className={`text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedCategory === "STAGE_2"
                  ? "bg-blue-50 border-blue-200"
                  : ""
              }`}
              onClick={() => setSelectedCategory("STAGE_2")}
            >
              <div className="text-2xl mb-2">⚙️</div>
              <p className="font-medium text-gray-900">Stage 2</p>
              <p className="text-sm text-gray-500">Feasibility</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">
                    {getTypeIcon(template.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500">{template.fileName}</p>
                  </div>
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-4">
                {template.stage && (
                  <span className="text-sm text-gray-500">
                    Stage: {template.stage}
                  </span>
                )}
                <Badge className={getTypeColor(template.type)}>
                  {formatTypeName(template.type)}
                </Badge>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(template)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
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
              {selectedCategory
                ? "No templates available for this category."
                : "No templates have been uploaded yet."}
            </p>
            {canManageTemplates && (
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Template Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {templates.length}
              </div>
              <div className="text-sm text-gray-500">Total Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {templateStats.length}
              </div>
              <div className="text-sm text-gray-500">Template Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {templates.filter((t) => t.isActive).length}
              </div>
              <div className="text-sm text-gray-500">Active Templates</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
