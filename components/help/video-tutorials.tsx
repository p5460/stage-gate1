"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Clock,
  Users,
  Search,
  Filter,
  BookOpen,
  FileText,
  HelpCircle,
  Settings,
  BarChart3,
  Star,
  Eye,
  Calendar,
} from "lucide-react";

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  views: number;
  rating: number;
  thumbnail: string;
  publishDate: Date;
  tags: string[];
}

export function VideoTutorials() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");

  const tutorials: VideoTutorial[] = [
    {
      id: "1",
      title: "Getting Started with the Stage-Gate Platform",
      description:
        "Complete introduction to the platform, covering basic navigation, user interface, and key features.",
      duration: "12:45",
      category: "getting-started",
      difficulty: "Beginner",
      views: 2340,
      rating: 4.8,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2024-01-15"),
      tags: ["introduction", "navigation", "basics"],
    },
    {
      id: "2",
      title: "Creating Your First Project",
      description:
        "Step-by-step guide to creating a new project, setting up team members, and configuring initial settings.",
      duration: "8:30",
      category: "projects",
      difficulty: "Beginner",
      views: 1890,
      rating: 4.7,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2024-01-12"),
      tags: ["projects", "creation", "setup"],
    },
    {
      id: "3",
      title: "Understanding Gate Reviews",
      description:
        "Comprehensive overview of the gate review process, decision types, and evaluation criteria.",
      duration: "15:20",
      category: "reviews",
      difficulty: "Intermediate",
      views: 1567,
      rating: 4.9,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2024-01-10"),
      tags: ["reviews", "evaluation", "decisions"],
    },
    {
      id: "4",
      title: "Document Management Best Practices",
      description:
        "Learn how to effectively organize, upload, and manage project documents using SharePoint integration.",
      duration: "10:15",
      category: "documents",
      difficulty: "Beginner",
      views: 1234,
      rating: 4.6,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2024-01-08"),
      tags: ["documents", "sharepoint", "organization"],
    },
    {
      id: "5",
      title: "Advanced Review Workflows",
      description:
        "Setting up multi-reviewer assignments, managing complex review processes, and handling conflicts.",
      duration: "18:45",
      category: "reviews",
      difficulty: "Advanced",
      views: 892,
      rating: 4.8,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2024-01-05"),
      tags: ["multi-reviewer", "workflows", "advanced"],
    },
    {
      id: "6",
      title: "Generating Reports and Analytics",
      description:
        "Complete guide to creating custom reports, exporting data, and using analytics dashboards.",
      duration: "13:30",
      category: "reports",
      difficulty: "Intermediate",
      views: 1045,
      rating: 4.7,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2024-01-03"),
      tags: ["reports", "analytics", "export"],
    },
    {
      id: "7",
      title: "Red Flag Management",
      description:
        "How to raise, track, and resolve red flags effectively to manage project risks.",
      duration: "9:20",
      category: "projects",
      difficulty: "Intermediate",
      views: 756,
      rating: 4.5,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2024-01-01"),
      tags: ["red-flags", "risk", "management"],
    },
    {
      id: "8",
      title: "User Roles and Permissions",
      description:
        "Understanding different user roles, permissions, and how to manage access control.",
      duration: "11:10",
      category: "administration",
      difficulty: "Intermediate",
      views: 623,
      rating: 4.6,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2023-12-28"),
      tags: ["roles", "permissions", "security"],
    },
    {
      id: "9",
      title: "Customizing Notification Settings",
      description:
        "Configure your notification preferences to stay informed about important project updates.",
      duration: "6:45",
      category: "settings",
      difficulty: "Beginner",
      views: 987,
      rating: 4.4,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2023-12-25"),
      tags: ["notifications", "preferences", "email"],
    },
    {
      id: "10",
      title: "Advanced Search and Filtering",
      description:
        "Master the search functionality to quickly find projects, documents, and information.",
      duration: "7:55",
      category: "navigation",
      difficulty: "Intermediate",
      views: 543,
      rating: 4.3,
      thumbnail: "/api/placeholder/320/180",
      publishDate: new Date("2023-12-22"),
      tags: ["search", "filtering", "navigation"],
    },
  ];

  const categories = [
    { id: "all", name: "All Categories", icon: BookOpen },
    { id: "getting-started", name: "Getting Started", icon: Play },
    { id: "projects", name: "Projects", icon: FileText },
    { id: "reviews", name: "Gate Reviews", icon: HelpCircle },
    { id: "documents", name: "Documents", icon: FileText },
    { id: "reports", name: "Reports", icon: BarChart3 },
    { id: "settings", name: "Settings", icon: Settings },
    { id: "administration", name: "Administration", icon: Users },
    { id: "navigation", name: "Navigation", icon: Search },
  ];

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || tutorial.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "all" ||
      tutorial.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search tutorials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center">
                        <category.icon className="h-4 w-4 mr-2" />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Tutorial */}
      {filteredTutorials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Featured Tutorial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative">
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <Play className="h-16 w-16 text-gray-400" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  {filteredTutorials[0].duration}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {filteredTutorials[0].title}
                  </h3>
                  <p className="text-gray-600">
                    {filteredTutorials[0].description}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge
                    className={getDifficultyColor(
                      filteredTutorials[0].difficulty
                    )}
                  >
                    {filteredTutorials[0].difficulty}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {renderStars(filteredTutorials[0].rating)}
                    <span className="text-sm text-gray-600 ml-1">
                      {filteredTutorials[0].rating}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Eye className="h-4 w-4" />
                    {filteredTutorials[0].views.toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredTutorials[0].tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button className="w-full lg:w-auto">
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.slice(1).map((tutorial) => (
          <Card key={tutorial.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="relative">
                <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <Play className="h-12 w-12 text-gray-400" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  {tutorial.duration}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold mb-1 line-clamp-2">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {tutorial.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={getDifficultyColor(tutorial.difficulty)}>
                    {tutorial.difficulty}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {renderStars(tutorial.rating)}
                    <span className="text-xs text-gray-600 ml-1">
                      {tutorial.rating}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{tutorial.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{tutorial.publishDate.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tutorial.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Watch Tutorial
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No tutorials found matching your criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedDifficulty("all");
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Learning Paths */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Paths</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">New User Path</h4>
              <p className="text-sm text-gray-600 mb-3">
                Perfect for users new to the platform
              </p>
              <div className="space-y-2 mb-4">
                <div className="text-sm">1. Getting Started</div>
                <div className="text-sm">2. Creating Your First Project</div>
                <div className="text-sm">3. Document Management</div>
                <div className="text-sm">4. Notification Settings</div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>4 videos</span>
                <span>~45 minutes</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Start Learning Path
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Project Manager Path</h4>
              <p className="text-sm text-gray-600 mb-3">
                For project leads and managers
              </p>
              <div className="space-y-2 mb-4">
                <div className="text-sm">1. Advanced Project Setup</div>
                <div className="text-sm">2. Team Management</div>
                <div className="text-sm">3. Red Flag Management</div>
                <div className="text-sm">4. Reports and Analytics</div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>5 videos</span>
                <span>~60 minutes</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Start Learning Path
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Reviewer Path</h4>
              <p className="text-sm text-gray-600 mb-3">
                For gate reviewers and evaluators
              </p>
              <div className="space-y-2 mb-4">
                <div className="text-sm">1. Understanding Gate Reviews</div>
                <div className="text-sm">2. Evaluation Criteria</div>
                <div className="text-sm">3. Advanced Review Workflows</div>
                <div className="text-sm">4. Multi-Reviewer Processes</div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>4 videos</span>
                <span>~55 minutes</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Start Learning Path
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
