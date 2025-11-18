"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface Cluster {
  id: string;
  name: string;
}

interface ProjectFiltersProps {
  clusters: Cluster[];
  currentFilters: {
    view?: string;
    search?: string;
    cluster?: string;
    stage?: string;
    status?: string;
  };
}

const stages = [
  { value: "STAGE_0", label: "Stage 0: Concept" },
  { value: "STAGE_1", label: "Stage 1: Research Planning" },
  { value: "STAGE_2", label: "Stage 2: Feasibility" },
  { value: "STAGE_3", label: "Stage 3: Maturation" },
];

const statuses = [
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "RED_FLAG", label: "Red Flag" },
];

export function ProjectFilters({
  clusters,
  currentFilters,
}: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/projects?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("cluster");
    params.delete("stage");
    params.delete("status");
    router.push(`/projects?${params.toString()}`);
  };

  const hasActiveFilters =
    currentFilters.cluster || currentFilters.stage || currentFilters.status;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <Select
            value={currentFilters.cluster || "all"}
            onValueChange={(value) => updateFilter("cluster", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Clusters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clusters</SelectItem>
              {clusters.map((cluster) => (
                <SelectItem key={cluster.id} value={cluster.name}>
                  {cluster.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.stage || "all"}
            onValueChange={(value) => updateFilter("stage", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.status || "all"}
            onValueChange={(value) => updateFilter("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
