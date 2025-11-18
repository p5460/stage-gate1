"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Calendar,
  Filter,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ExportFilters {
  projectId?: string;
  stage?: string;
  reviewerId?: string;
  decision?: string;
  dateFrom?: string;
  dateTo?: string;
  isCompleted?: boolean;
}

interface ExportSummary {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  completionRate: number;
}

export function GateReviewsExport() {
  const [isPending, startTransition] = useTransition();
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [format, setFormat] = useState<"csv" | "json" | "excel">("csv");
  const [filters, setFilters] = useState<ExportFilters>({});
  const [summary, setSummary] = useState<ExportSummary | null>(null);

  const handleFilterChange = (
    key: keyof ExportFilters,
    value: string | boolean | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const params = new URLSearchParams();
      params.set("preview", "true");

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, value.toString());
        }
      });

      const response = await fetch(
        `/api/gate-reviews/export?${params.toString()}`
      );
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSummary(data.summary);
    } catch (error) {
      toast.error("Failed to load preview");
      console.error("Preview error:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExport = () => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        params.set("format", format);

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            params.set(key, value.toString());
          }
        });

        const response = await fetch(
          `/api/gate-reviews/export?${params.toString()}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || "Export failed");
          return;
        }

        // Get filename from headers
        const contentDisposition = response.headers.get("Content-Disposition");
        const filename =
          contentDisposition?.match(/filename="(.+)"/)?.[1] ||
          `gate-reviews-export.${format}`;
        const exportCount = response.headers.get("X-Export-Count") || "0";

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Successfully exported ${exportCount} gate reviews`);
      } catch (error) {
        toast.error("Failed to export gate reviews");
        console.error("Export error:", error);
      }
    });
  };

  const formatOptions = [
    {
      value: "csv",
      label: "CSV",
      icon: FileSpreadsheet,
      description: "Comma-separated values",
    },
    {
      value: "json",
      label: "JSON",
      icon: FileJson,
      description: "JavaScript Object Notation",
    },
    {
      value: "excel",
      label: "Excel",
      icon: FileText,
      description: "Excel workbook format",
    },
  ];

  const stageOptions = [
    { value: "STAGE_0", label: "Stage 0 - Idea" },
    { value: "STAGE_1", label: "Stage 1 - Concept" },
    { value: "STAGE_2", label: "Stage 2 - Development" },
    { value: "STAGE_3", label: "Stage 3 - Implementation" },
  ];

  const decisionOptions = [
    { value: "GO", label: "Go" },
    { value: "RECYCLE", label: "Recycle" },
    { value: "HOLD", label: "Hold" },
    { value: "STOP", label: "Stop" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Gate Reviews
          </CardTitle>
          <CardDescription>
            Export gate review data with customizable filters and formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      format === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setFormat(option.value as any)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label className="text-base font-medium">Filters</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Project ID Filter */}
              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  placeholder="e.g., PROJ-001"
                  value={filters.projectId || ""}
                  onChange={(e) =>
                    handleFilterChange("projectId", e.target.value)
                  }
                />
              </div>

              {/* Stage Filter */}
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={filters.stage || "all"}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "stage",
                      value === "all" ? undefined : value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {stageOptions.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Decision Filter */}
              <div className="space-y-2">
                <Label htmlFor="decision">Decision</Label>
                <Select
                  value={filters.decision || "all"}
                  onValueChange={(value) =>
                    handleFilterChange(
                      "decision",
                      value === "all" ? undefined : value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All decisions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All decisions</SelectItem>
                    {decisionOptions.map((decision) => (
                      <SelectItem key={decision.value} value={decision.value}>
                        {decision.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reviewer ID Filter */}
              <div className="space-y-2">
                <Label htmlFor="reviewerId">Reviewer ID</Label>
                <Input
                  id="reviewerId"
                  placeholder="Reviewer user ID"
                  value={filters.reviewerId || ""}
                  onChange={(e) =>
                    handleFilterChange("reviewerId", e.target.value)
                  }
                />
              </div>

              {/* Date From Filter */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value)
                  }
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-2">
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>
            </div>

            {/* Completion Status Filter */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="completedOnly"
                checked={filters.isCompleted === true}
                onCheckedChange={(checked) =>
                  handleFilterChange("isCompleted", checked ? true : undefined)
                }
              />
              <Label htmlFor="completedOnly">Completed reviews only</Label>
            </div>
          </div>

          <Separator />

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <Label className="text-base font-medium">Preview</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPreview}
                disabled={isLoadingPreview}
              >
                {isLoadingPreview ? "Loading..." : "Load Preview"}
              </Button>
            </div>

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Total Reviews
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {summary.totalReviews}
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Completed
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {summary.completedReviews}
                  </p>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">
                      Pending
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {summary.pendingReviews}
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">
                      Completion Rate
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {summary.completionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Export Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {summary ? (
                <span>Ready to export {summary.totalReviews} gate reviews</span>
              ) : (
                <span>Click "Load Preview" to see export summary</span>
              )}
            </div>
            <Button
              onClick={handleExport}
              disabled={isPending || !summary}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isPending ? "Exporting..." : `Export ${format.toUpperCase()}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Export Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">CSV Format</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Compatible with Excel and Google Sheets</li>
                <li>• Includes all review data and metadata</li>
                <li>• Easy to filter and analyze</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">JSON Format</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Machine-readable format</li>
                <li>• Preserves data structure</li>
                <li>• Ideal for API integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Excel Format</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Multiple worksheets</li>
                <li>• Includes summary statistics</li>
                <li>• Professional formatting</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Exported Data Includes:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "Review ID and dates",
                "Project information",
                "Reviewer details",
                "Review decisions",
                "Scores and comments",
                "Completion status",
                "Project cluster info",
                "Review stage details",
                "Timestamps",
              ].map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="justify-start"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
