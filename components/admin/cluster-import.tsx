"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  Database,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { createCluster } from "@/actions/clusters";

interface ClusterImportProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface ImportCluster {
  name: string;
  description?: string;
  color?: string;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
}

export function ClusterImport({ onSuccess, trigger }: ClusterImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [importMethod, setImportMethod] = useState<"file" | "text">("file");
  const [importData, setImportData] = useState("");
  const [parsedClusters, setParsedClusters] = useState<ImportCluster[]>([]);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    validateColors: true,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      parseImportData(content, file.type);
    };

    if (file.type === "application/json") {
      reader.readAsText(file);
    } else if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      toast.error("Please upload a JSON or CSV file");
    }
  };

  const parseImportData = (data: string, fileType?: string) => {
    try {
      let clusters: any[] = [];

      if (
        fileType === "application/json" ||
        data.trim().startsWith("{") ||
        data.trim().startsWith("[")
      ) {
        // Parse JSON
        const jsonData = JSON.parse(data);
        if (Array.isArray(jsonData)) {
          clusters = jsonData;
        } else if (jsonData.clusters && Array.isArray(jsonData.clusters)) {
          clusters = jsonData.clusters;
        } else {
          clusters = [jsonData];
        }
      } else {
        // Parse CSV
        const lines = data.trim().split("\n");
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split(",")
            .map((v) => v.trim().replace(/"/g, ""));
          const cluster: any = {};

          headers.forEach((header, index) => {
            if (values[index]) {
              cluster[header.toLowerCase()] = values[index];
            }
          });

          clusters.push(cluster);
        }
      }

      // Validate and process clusters
      const processedClusters: ImportCluster[] = clusters.map((cluster) => {
        const errors: string[] = [];
        let status: "valid" | "invalid" | "duplicate" = "valid";

        // Validate required fields
        if (!cluster.name || cluster.name.trim() === "") {
          errors.push("Name is required");
          status = "invalid";
        }

        // Validate color format
        if (cluster.color && importOptions.validateColors) {
          const colorRegex = /^#[0-9A-F]{6}$/i;
          if (!colorRegex.test(cluster.color)) {
            errors.push("Invalid color format (use #RRGGBB)");
            status = "invalid";
          }
        }

        // Check for duplicates (simplified - in real app would check against existing clusters)
        const duplicateInImport =
          clusters.filter((c) => c.name === cluster.name).length > 1;
        if (duplicateInImport) {
          errors.push("Duplicate name in import data");
          status = "duplicate";
        }

        return {
          name: cluster.name || "",
          description: cluster.description || "",
          color: cluster.color || "#3B82F6",
          status,
          errors,
        };
      });

      setParsedClusters(processedClusters);
    } catch (error) {
      toast.error("Failed to parse import data. Please check the format.");
      setParsedClusters([]);
    }
  };

  const handleTextImport = () => {
    if (!importData.trim()) {
      toast.error("Please enter import data");
      return;
    }
    parseImportData(importData);
  };

  const handleImport = () => {
    const validClusters = parsedClusters.filter(
      (c) =>
        c.status === "valid" ||
        (c.status === "duplicate" && !importOptions.skipDuplicates)
    );

    if (validClusters.length === 0) {
      toast.error("No valid clusters to import");
      return;
    }

    startTransition(async () => {
      try {
        const results = await Promise.all(
          validClusters.map((cluster) =>
            createCluster({
              name: cluster.name,
              description: cluster.description,
              color: cluster.color,
            })
          )
        );

        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        if (successful > 0) {
          toast.success(
            `${successful} cluster${successful !== 1 ? "s" : ""} imported successfully`
          );
        }
        if (failed > 0) {
          toast.error(
            `${failed} cluster${failed !== 1 ? "s" : ""} failed to import`
          );
        }

        if (successful > 0) {
          setIsOpen(false);
          setParsedClusters([]);
          setImportData("");
          onSuccess?.();
        }
      } catch (error) {
        toast.error("An error occurred during import");
      }
    });
  };

  const downloadTemplate = (format: "json" | "csv") => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      const template = [
        {
          name: "Example Cluster 1",
          description: "Description for the first cluster",
          color: "#3B82F6",
        },
        {
          name: "Example Cluster 2",
          description: "Description for the second cluster",
          color: "#10B981",
        },
      ];
      content = JSON.stringify(template, null, 2);
      filename = "cluster-import-template.json";
      mimeType = "application/json";
    } else {
      content = [
        "name,description,color",
        '"Example Cluster 1","Description for the first cluster","#3B82F6"',
        '"Example Cluster 2","Description for the second cluster","#10B981"',
      ].join("\n");
      filename = "cluster-import-template.csv";
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "invalid":
        return <X className="h-4 w-4 text-red-600" />;
      case "duplicate":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800";
      case "invalid":
        return "bg-red-100 text-red-800";
      case "duplicate":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const validCount = parsedClusters.filter((c) => c.status === "valid").length;
  const invalidCount = parsedClusters.filter(
    (c) => c.status === "invalid"
  ).length;
  const duplicateCount = parsedClusters.filter(
    (c) => c.status === "duplicate"
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Clusters
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import Clusters</span>
          </DialogTitle>
          <DialogDescription>
            Import clusters from JSON or CSV files, or paste data directly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    importMethod === "file"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setImportMethod("file")}
                >
                  <div className="flex items-center space-x-3">
                    <Upload className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-medium">File Upload</h3>
                      <p className="text-sm text-gray-500">
                        Upload JSON or CSV file
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    importMethod === "text"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setImportMethod("text")}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-medium">Text Input</h3>
                      <p className="text-sm text-gray-500">
                        Paste JSON or CSV data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate("json")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate("csv")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV Template
                </Button>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Info className="h-4 w-4" />
                  <span>Download templates to see the expected format</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {importMethod === "file" ? "Upload File" : "Import Data"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {importMethod === "file" ? (
                <div>
                  <Label htmlFor="importFile">Select File</Label>
                  <Input
                    id="importFile"
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Supported formats: JSON (.json) and CSV (.csv)
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="importText">Import Data</Label>
                  <Textarea
                    id="importText"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste your JSON or CSV data here..."
                    rows={8}
                    className="mt-1 font-mono text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTextImport}
                      disabled={!importData.trim()}
                    >
                      Parse Data
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipDuplicates"
                    checked={importOptions.skipDuplicates}
                    onCheckedChange={(checked) =>
                      setImportOptions({
                        ...importOptions,
                        skipDuplicates: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="skipDuplicates">Skip duplicate names</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="updateExisting"
                    checked={importOptions.updateExisting}
                    onCheckedChange={(checked) =>
                      setImportOptions({
                        ...importOptions,
                        updateExisting: checked as boolean,
                      })
                    }
                    disabled
                  />
                  <Label htmlFor="updateExisting" className="text-gray-500">
                    Update existing clusters (not implemented)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="validateColors"
                    checked={importOptions.validateColors}
                    onCheckedChange={(checked) =>
                      setImportOptions({
                        ...importOptions,
                        validateColors: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="validateColors">Validate color formats</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {parsedClusters.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Import Preview</CardTitle>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{validCount} valid</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>{duplicateCount} duplicates</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <X className="h-4 w-4 text-red-600" />
                      <span>{invalidCount} invalid</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {parsedClusters.map((cluster, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(cluster.status)}
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: cluster.color }}
                        />
                        <div>
                          <h4 className="font-medium">{cluster.name}</h4>
                          {cluster.description && (
                            <p className="text-sm text-gray-500">
                              {cluster.description}
                            </p>
                          )}
                          {cluster.errors.length > 0 && (
                            <div className="text-sm text-red-600 mt-1">
                              {cluster.errors.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(cluster.status)}>
                        {cluster.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                isPending || parsedClusters.length === 0 || validCount === 0
              }
            >
              {isPending
                ? "Importing..."
                : `Import ${validCount} Cluster${validCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
