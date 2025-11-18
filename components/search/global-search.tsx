"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  FolderOpen,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "project" | "document" | "user" | "redflag";
  url: string;
}

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Add keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=8`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            toast.error("Please log in to search");
            return;
          }
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.results) {
          const searchResults: SearchResult[] = [];

          // Add projects
          if (data.results.projects && Array.isArray(data.results.projects)) {
            data.results.projects.forEach((project: any) => {
              searchResults.push({
                id: `project-${project.id}`,
                title: project.name || "Untitled Project",
                description: `${project.projectId || "No ID"} • ${project.cluster?.name || "No cluster"} • ${project.status || "Unknown status"}`,
                type: "project",
                url: `/projects/${project.id}`,
              });
            });
          }

          // Add documents
          if (data.results.documents && Array.isArray(data.results.documents)) {
            data.results.documents.forEach((doc: any) => {
              searchResults.push({
                id: `document-${doc.id}`,
                title: doc.name || "Untitled Document",
                description: `${doc.project?.name || "Unknown project"} • ${doc.type?.replace("_", " ") || "Document"}`,
                type: "document",
                url: doc.project?.id
                  ? `/projects/${doc.project.id}?tab=documents&docId=${doc.id}`
                  : `/projects`,
              });
            });
          }

          // Add users (if available)
          if (data.results.users && Array.isArray(data.results.users)) {
            data.results.users.forEach((user: any) => {
              searchResults.push({
                id: `user-${user.id}`,
                title: user.name || "Unknown User",
                description: `${user.email || "No email"} • ${user.role?.replace("_", " ") || "User"} • ${user.department || "No department"}`,
                type: "user",
                url: `/admin/users?userId=${user.id}`,
              });
            });
          }

          // Add red flags
          if (data.results.redFlags && Array.isArray(data.results.redFlags)) {
            data.results.redFlags.forEach((flag: any) => {
              searchResults.push({
                id: `redflag-${flag.id}`,
                title: flag.title || "Red Flag",
                description: `${flag.project?.name || "Unknown project"} • ${flag.severity || "Unknown severity"} • ${flag.status || "Open"}`,
                type: "redflag",
                url: `/red-flags?flagId=${flag.id}`,
              });
            });
          }

          // Add comments
          if (data.results.comments && Array.isArray(data.results.comments)) {
            data.results.comments.forEach((comment: any) => {
              searchResults.push({
                id: `comment-${comment.id}`,
                title: `Comment by ${comment.author?.name || "Unknown"}`,
                description: `${comment.project?.name || "Unknown project"} • ${comment.content?.substring(0, 50) || "No content"}...`,
                type: "document", // Using document icon for comments
                url: comment.project?.id
                  ? `/projects/${comment.project.id}?tab=comments&commentId=${comment.id}`
                  : `/projects`,
              });
            });
          }

          setResults(searchResults);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
        if (error instanceof Error && error.name === "AbortError") {
          toast.error("Search timed out. Please try again.");
        } else {
          toast.error("Search failed. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case "project":
        return FolderOpen;
      case "document":
        return FileText;
      case "user":
        return Users;
      case "redflag":
        return AlertTriangle;
      default:
        return Search;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case "project":
        return "text-blue-600";
      case "document":
        return "text-green-600";
      case "user":
        return "text-purple-600";
      case "redflag":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.url) {
      // Provide user feedback with more specific messaging
      const typeLabels = {
        project: "project",
        document: "document",
        user: "user profile",
        redflag: "red flag",
      };

      toast.success(
        `Opening ${typeLabels[result.type] || "item"}: ${result.title}`
      );

      // Navigate to the result
      router.push(result.url);
      setOpen(false);
      setQuery("");
    } else {
      toast.error("Unable to navigate to this result");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
    if (e.key === "Enter" && results.length > 0) {
      // Navigate to first result on Enter
      if (e.ctrlKey || e.metaKey) {
        // Open in new tab if Ctrl/Cmd+Enter
        window.open(results[0].url, "_blank");
        setOpen(false);
        setQuery("");
      } else {
        handleSelect(results[0]);
      }
    }
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 text-yellow-900 px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects, documents, users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-16 w-64"
              onFocus={() => setOpen(true)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading ? (
                <div className="p-6 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Searching...</span>
                  </div>
                </div>
              ) : query.length < 2 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Search the platform</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Type at least 2 characters to search
                  </p>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-600">
                      Search across:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Projects
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Documents
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Users
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Red Flags
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-400 space-y-1">
                    <div>
                      Press{" "}
                      <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">
                        ⌘K
                      </kbd>{" "}
                      to focus
                    </div>
                    <div>
                      <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">
                        Enter
                      </kbd>{" "}
                      to open •{" "}
                      <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">
                        ⌘Enter
                      </kbd>{" "}
                      for new tab
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No results found for "{query}"</p>
                  <p className="text-xs mt-1">
                    Try different keywords or check spelling
                  </p>
                </div>
              ) : (
                <CommandGroup className="group">
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                    {results.length} result{results.length !== 1 ? "s" : ""}{" "}
                    found
                  </div>
                  {results.map((result) => {
                    const IconComponent = getResultIcon(result.type);
                    const iconColor = getResultColor(result.type);

                    return (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            // Open in new tab if Ctrl/Cmd+Click
                            window.open(result.url, "_blank");
                            setOpen(false);
                            setQuery("");
                          } else {
                            handleSelect(result);
                          }
                        }}
                        className="flex items-center space-x-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-l-2 border-transparent hover:border-blue-500 focus:bg-blue-50 focus:border-blue-500 focus:outline-none"
                        role="button"
                        aria-label={`Navigate to ${result.type}: ${result.title}`}
                      >
                        <div className={`flex-shrink-0 ${iconColor}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {highlightSearchTerm(result.title, query)}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {result.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex flex-col items-end space-y-1">
                            <div className="text-xs text-blue-500 font-medium">
                              →
                            </div>
                            <div className="text-xs text-gray-400">
                              ⌘+click for new tab
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
