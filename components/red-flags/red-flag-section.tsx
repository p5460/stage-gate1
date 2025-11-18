"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RaiseRedFlagForm } from "./raise-red-flag-form";
import { EditRedFlagForm } from "./edit-red-flag-form";
import {
  getRedFlags,
  updateRedFlag,
  deleteRedFlag,
  exportRedFlags,
} from "@/actions/red-flags";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  raisedBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
  project?: {
    id: string;
    name: string;
    projectId: string;
  };
}

interface RedFlagSectionProps {
  projectId?: string;
  title?: string;
  showCreateButton?: boolean;
}

export function RedFlagSection({
  projectId,
  title = "Red Flags",
  showCreateButton = true,
}: RedFlagSectionProps) {
  const { data: session } = useSession();
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRedFlag, setEditingRedFlag] = useState<RedFlag | null>(null);

  useEffect(() => {
    loadRedFlags();
  }, [projectId]);

  const loadRedFlags = async () => {
    setLoading(true);
    const result = await getRedFlags(projectId);
    if (result.success) {
      setRedFlags(result.redFlags as RedFlag[]);
    } else {
      toast.error("Failed to load red flags");
    }
    setLoading(false);
  };

  const handleStatusChange = async (redFlagId: string, newStatus: string) => {
    const result = await updateRedFlag(redFlagId, { status: newStatus as any });

    if (result.success) {
      await loadRedFlags();
      toast.success(`Red flag ${newStatus.toLowerCase()}`);
    } else {
      toast.error(result.error || "Failed to update red flag");
    }
  };

  const handleDeleteRedFlag = async (redFlagId: string) => {
    if (!confirm("Are you sure you want to delete this red flag?")) return;

    const result = await deleteRedFlag(redFlagId);

    if (result.success) {
      await loadRedFlags();
      toast.success("Red flag deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete red flag");
    }
  };

  const handleExportRedFlags = async (format: "json" | "csv") => {
    try {
      console.log("Export clicked:", format, "projectId:", projectId);
      toast.info(`Exporting red flags as ${format.toUpperCase()}...`);

      const result = await exportRedFlags(projectId, format);
      console.log("Export result:", result);

      if (result.success) {
        // Create and download file
        const blob = new Blob([result.data], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`Red flags exported as ${format.toUpperCase()}`);
      } else {
        console.error("Export failed:", result.error);
        toast.error(result.error || "Failed to export red flags");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An error occurred while exporting");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "CLOSED":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canEditRedFlag = (redFlag: RedFlag) => {
    return (
      session?.user?.id === redFlag.raisedBy.id ||
      session?.user?.role === "ADMIN"
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please log in to view red flags.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="secondary">{redFlags.length}</Badge>
        </div>

        <div className="flex items-center space-x-2">
          {redFlags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export ({redFlags.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportRedFlags("json")}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportRedFlags("csv")}>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showCreateButton && projectId && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Raise Red Flag
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Create red flag form */}
      {showCreateForm && projectId && (
        <RaiseRedFlagForm
          projectId={projectId}
          onSuccess={() => {
            setShowCreateForm(false);
            loadRedFlags();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Red flags list */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading red flags...</p>
        </div>
      ) : redFlags.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {projectId
              ? "No red flags for this project."
              : "No red flags found."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {redFlags.map((redFlag) => (
            <Card key={redFlag.id} className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{redFlag.title}</CardTitle>
                      <Badge className={getSeverityColor(redFlag.severity)}>
                        {redFlag.severity}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getStatusColor(redFlag.status)}
                      >
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(redFlag.status)}
                          <span>{redFlag.status.replace("_", " ")}</span>
                        </span>
                      </Badge>
                    </div>

                    {!projectId && redFlag.project && (
                      <p className="text-sm text-muted-foreground">
                        Project: {redFlag.project.name} (
                        {redFlag.project.projectId})
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status change dropdown */}
                    <Select
                      value={redFlag.status}
                      onValueChange={(value) =>
                        handleStatusChange(redFlag.id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    {canEditRedFlag(redFlag) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit options"
                          >
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              console.log(
                                "Edit clicked for red flag:",
                                redFlag.id
                              );
                              setEditingRedFlag(redFlag);
                              toast.info("Opening edit form...");
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRedFlag(redFlag.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                  {redFlag.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={redFlag.raisedBy.image || ""} />
                      <AvatarFallback>
                        {redFlag.raisedBy.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Raised by {redFlag.raisedBy.name || "Unknown"} on{" "}
                      {formatDate(redFlag.createdAt)}
                    </span>
                  </div>

                  {redFlag.resolvedAt && (
                    <span>Resolved on {formatDate(redFlag.resolvedAt)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit red flag form */}
      {editingRedFlag && (
        <EditRedFlagForm
          open={!!editingRedFlag}
          onOpenChange={(open) => !open && setEditingRedFlag(null)}
          redFlag={editingRedFlag}
          onSuccess={() => {
            setEditingRedFlag(null);
            loadRedFlags();
          }}
        />
      )}
    </div>
  );
}
