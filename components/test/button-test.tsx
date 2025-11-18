"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Edit } from "lucide-react";
import { toast } from "sonner";

export function ButtonTest() {
  const [testData] = useState([
    {
      id: "1",
      title: "Test Red Flag",
      description: "Test description",
      severity: "HIGH",
      status: "OPEN",
    },
  ]);

  const handleExportTest = (format: "json" | "csv") => {
    console.log("Export clicked:", format);
    toast.success(`Export ${format} clicked!`);
  };

  const handleEditTest = (id: string) => {
    console.log("Edit clicked:", id);
    toast.success(`Edit clicked for ${id}!`);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Button Functionality Test</h2>

      {/* Export Test */}
      <div className="flex items-center space-x-2">
        <span>Export Test:</span>
        {testData.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportTest("json")}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportTest("csv")}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Edit Test */}
      <div className="flex items-center space-x-2">
        <span>Edit Test:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              •••
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleEditTest("test-1")}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Direct Button Test */}
      <div className="flex items-center space-x-2">
        <span>Direct Button Test:</span>
        <Button onClick={() => toast.success("Direct button works!")}>
          Test Button
        </Button>
      </div>
    </div>
  );
}
