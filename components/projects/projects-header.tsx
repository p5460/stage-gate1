"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ExportProjects } from "@/components/projects/export-projects";
import { Search, Plus, Download } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

interface ProjectsHeaderProps {
  clusters: Array<{ id: string; name: string }>;
  projects?: Array<{
    id: string;
    projectId: string;
    name: string;
    status: string;
    currentStage: string;
    lead: {
      name: string | null;
    };
    cluster: {
      name: string;
    };
  }>;
}

export function ProjectsHeader({
  clusters,
  projects = [],
}: ProjectsHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard" label="Back to Dashboard" />
          <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
              onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          {projects.length > 0 && <ExportProjects projects={projects} />}
          <Link href="/projects/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
