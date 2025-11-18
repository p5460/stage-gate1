"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";

interface ExportReportsProps {
  className?: string;
}

export function ExportReports({ className }: ExportReportsProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState("comprehensive");
  const [format, setFormat] = useState("json");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/reports/export?${params}`);

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success("Report exported successfully");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to export report");
      console.error("Error exporting report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes = [
    {
      value: "comprehensive",
      label: "Comprehensive Report",
      description: "All system data and analytics",
    },
    {
      value: "projects",
      label: "Projects Report",
      description: "Detailed project information",
    },
    {
      value: "reviews",
      label: "Gate Reviews Report",
      description: "Review decisions and feedback",
    },
    {
      value: "financial",
      label: "Financial Report",
      description: "Budget and cost analysis",
    },
    {
      value: "users",
      label: "Users Report",
      description: "User activity and statistics",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Reports
          </DialogTitle>
          <DialogDescription>
            Generate and download comprehensive reports in your preferred
            format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-500">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON - Structured data</SelectItem>
                <SelectItem value="csv">CSV - Spreadsheet format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="startDate" className="text-sm">
                  From
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm">
                  To
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong>{" "}
              {reportTypes.find((t) => t.value === reportType)?.label} in{" "}
              {format.toUpperCase()} format
              {startDate && endDate && (
                <span>
                  {" "}
                  from {startDate} to {endDate}
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
