"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportComments } from "@/actions/comments";
import { exportRedFlags } from "@/actions/red-flags";

interface SimpleExportTestProps {
  projectId?: string;
}

export function SimpleExportTest({
  projectId = "test-project",
}: SimpleExportTestProps) {
  const handleExportComments = async (format: "json" | "csv") => {
    try {
      console.log("Testing comment export:", format);
      toast.info(`Testing comment export as ${format}...`);

      const result = await exportComments(projectId, format);
      console.log("Comment export result:", result);

      if (result.success) {
        toast.success(`Comment export test successful: ${format}`);
      } else {
        toast.error(`Comment export test failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Comment export test error:", error);
      toast.error("Comment export test error");
    }
  };

  const handleExportRedFlags = async (format: "json" | "csv") => {
    try {
      console.log("Testing red flag export:", format);
      toast.info(`Testing red flag export as ${format}...`);

      const result = await exportRedFlags(projectId, format);
      console.log("Red flag export result:", result);

      if (result.success) {
        toast.success(`Red flag export test successful: ${format}`);
      } else {
        toast.error(`Red flag export test failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Red flag export test error:", error);
      toast.error("Red flag export test error");
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Export Functionality Test</h3>

      <div className="space-y-2">
        <h4 className="font-medium">Comment Export Test:</h4>
        <div className="flex space-x-2">
          <Button
            onClick={() => handleExportComments("json")}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Comments JSON
          </Button>
          <Button
            onClick={() => handleExportComments("csv")}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Comments CSV
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Red Flag Export Test:</h4>
        <div className="flex space-x-2">
          <Button
            onClick={() => handleExportRedFlags("json")}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Red Flags JSON
          </Button>
          <Button
            onClick={() => handleExportRedFlags("csv")}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Red Flags CSV
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>Project ID: {projectId}</p>
        <p>Check console for detailed logs</p>
      </div>
    </div>
  );
}
