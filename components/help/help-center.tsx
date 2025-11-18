"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Video,
  BookOpen,
  Users,
  Settings,
  Zap,
  Send,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  lastUpdated: Date;
}

export function HelpCenter() {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    null
  );
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "medium" as const,
  });

  // Mock data
  const helpArticles: HelpArticle[] = [
    {
      id: "1",
      title: "Getting Started with Projects",
      content:
        "Learn how to create and manage projects in the Stage-Gate platform. This comprehensive guide covers project setup, team assignment, milestone planning, and document organization. Perfect for new users looking to understand the project lifecycle from concept to completion.",
      category: "projects",
      tags: ["beginner", "projects", "setup"],
      views: 1250,
      helpful: 45,
      notHelpful: 3,
      lastUpdated: new Date("2024-01-15"),
    },
    {
      id: "2",
      title: "Understanding Gate Reviews",
      content:
        "Complete guide to the gate review process and decision making. Learn about the four decision types (GO, RECYCLE, HOLD, STOP), evaluation criteria, reviewer assignments, and how to prepare for successful gate reviews.",
      category: "reviews",
      tags: ["reviews", "process", "decisions"],
      views: 890,
      helpful: 38,
      notHelpful: 2,
      lastUpdated: new Date("2024-01-10"),
    },
    {
      id: "3",
      title: "Document Management Best Practices",
      content:
        "How to effectively organize and manage project documents using SharePoint integration. Covers file naming conventions, version control, access permissions, and automated document workflows.",
      category: "documents",
      tags: ["documents", "organization", "best-practices"],
      views: 675,
      helpful: 29,
      notHelpful: 1,
      lastUpdated: new Date("2024-01-08"),
    },
    {
      id: "4",
      title: "Role-Based Access Control",
      content:
        "Understanding user roles and permissions in the platform. Learn about Admin, Gatekeeper, Project Lead, Researcher, and Reviewer roles, and how permissions affect your access to features.",
      category: "account",
      tags: ["roles", "permissions", "security"],
      views: 542,
      helpful: 31,
      notHelpful: 2,
      lastUpdated: new Date("2024-01-12"),
    },
    {
      id: "5",
      title: "Generating Reports and Analytics",
      content:
        "Comprehensive guide to creating custom reports, exporting data, and using analytics dashboards. Includes project performance metrics, budget tracking, and team productivity reports.",
      category: "reports",
      tags: ["reports", "analytics", "export"],
      views: 423,
      helpful: 27,
      notHelpful: 1,
      lastUpdated: new Date("2024-01-09"),
    },
    {
      id: "6",
      title: "Notification Settings and Preferences",
      content:
        "Configure your notification preferences to stay informed about project updates, review assignments, and system alerts. Learn how to customize email notifications and in-app alerts.",
      category: "settings",
      tags: ["notifications", "preferences", "email"],
      views: 389,
      helpful: 22,
      notHelpful: 0,
      lastUpdated: new Date("2024-01-11"),
    },
    {
      id: "7",
      title: "Red Flag Management",
      content:
        "How to raise, track, and resolve red flags in projects. Understand severity levels, escalation procedures, and best practices for risk management and issue resolution.",
      category: "projects",
      tags: ["red-flags", "risk", "management"],
      views: 298,
      helpful: 18,
      notHelpful: 1,
      lastUpdated: new Date("2024-01-07"),
    },
    {
      id: "8",
      title: "Multi-Reviewer Assignments",
      content:
        "Setting up and managing multi-reviewer gate reviews. Learn how to assign multiple reviewers, track review progress, and handle conflicting decisions in the review process.",
      category: "reviews",
      tags: ["multi-reviewer", "assignments", "workflow"],
      views: 267,
      helpful: 15,
      notHelpful: 0,
      lastUpdated: new Date("2024-01-06"),
    },
  ];

  const categories = [
    { id: "all", name: "All Categories", icon: BookOpen },
    { id: "projects", name: "Projects", icon: FileText },
    { id: "reviews", name: "Gate Reviews", icon: HelpCircle },
    { id: "documents", name: "Documents", icon: FileText },
    { id: "reports", name: "Reports", icon: BarChart3 },
    { id: "settings", name: "Settings", icon: Settings },
    { id: "account", name: "Account", icon: Users },
  ];

  const faqs = [
    {
      question: "How do I create a new project?",
      answer:
        "Navigate to the Projects page and click the 'New Project' button. Fill in the required information including project name, description, cluster, and team members. You'll need to select a cluster, assign a project lead, and set initial milestones.",
      category: "projects",
    },
    {
      question: "What are the different project stages?",
      answer:
        "The platform uses a 4-stage process: Stage 0 (Concept) - initial idea development, Stage 1 (Research Planning) - detailed planning and resource allocation, Stage 2 (Feasibility) - proof of concept and validation, and Stage 3 (Maturation) - final development and implementation. Each stage has specific deliverables and gate review criteria.",
      category: "projects",
    },
    {
      question: "How do gate reviews work?",
      answer:
        "Gate reviews are decision points between stages. A designated reviewer evaluates the project against predefined criteria and makes one of four decisions: GO (proceed to next stage), RECYCLE (return to current stage for improvements), HOLD (pause project), or STOP (terminate project). Reviews can be assigned to single or multiple reviewers.",
      category: "reviews",
    },
    {
      question: "Where are documents stored?",
      answer:
        "All project documents are stored in SharePoint with automatic organization by project. You can upload, download, and manage documents directly from the platform. Documents are automatically categorized by type and stage, with version control and access permissions managed automatically.",
      category: "documents",
    },
    {
      question: "How do I generate reports?",
      answer:
        "Go to the Reports section where you can generate various types of reports including project summaries, budget analysis, team performance metrics, and gate review analytics. You can export reports in PDF, Excel, or CSV formats and schedule automated report generation.",
      category: "reports",
    },
    {
      question: "Can I change my account settings?",
      answer:
        "Yes, go to Settings to update your profile information, notification preferences, security settings, and password. You can also configure email notifications, set your timezone, and manage two-factor authentication if enabled by your administrator.",
      category: "account",
    },
    {
      question: "What are red flags and how do I use them?",
      answer:
        "Red flags are risk indicators that can be raised on projects to highlight issues or concerns. They have severity levels (Low, Medium, High, Critical) and can be assigned to team members for resolution. Red flags help track and manage project risks proactively.",
      category: "projects",
    },
    {
      question: "How do I assign multiple reviewers to a gate review?",
      answer:
        "When creating a gate review, select 'Multi-Reviewer' mode and add multiple reviewers. You can set whether all reviewers must agree or if majority consensus is sufficient. The system will track each reviewer's decision and provide a consolidated result.",
      category: "reviews",
    },
    {
      question: "Can I customize my notification preferences?",
      answer:
        "Yes, in Settings > Notifications, you can customize which events trigger email notifications, including review assignments, project updates, red flag alerts, document uploads, and milestone reminders. You can also enable/disable the weekly digest email.",
      category: "settings",
    },
    {
      question: "How do I search for projects or documents?",
      answer:
        "Use the global search (Ctrl+K) to search across projects, documents, users, and red flags. The search supports keywords, project IDs, and document names. You can also use filters in the Projects and Documents sections for more specific searches.",
      category: "projects",
    },
    {
      question: "What user roles are available in the system?",
      answer:
        "The system has six main roles: Admin (full system access), Gatekeeper (review management), Project Lead (project creation and management), Researcher (project participation), Reviewer (gate review participation), and User (basic access). Each role has specific permissions and capabilities.",
      category: "account",
    },
    {
      question: "How do I export project data?",
      answer:
        "Project data can be exported from the Reports section or individual project pages. You can export project summaries, review histories, document lists, and analytics data in various formats. Some exports may require specific permissions based on your role.",
      category: "reports",
    },
  ];

  const quickLinks = [
    {
      title: "User Guide",
      icon: BookOpen,
      url: "/help/user-guide",
      description: "Comprehensive platform documentation and guides",
    },
    {
      title: "Video Tutorials",
      icon: Video,
      url: "/help/tutorials",
      description: "Step-by-step video walkthroughs and training",
    },
    {
      title: "API Documentation",
      icon: FileText,
      url: "/help/api",
      description: "Technical documentation for developers",
    },
    {
      title: "System Status",
      icon: Zap,
      url: "/help/status",
      description: "Real-time system health and performance",
    },
  ];

  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitTicket = () => {
    if (
      !ticketForm.subject ||
      !ticketForm.description ||
      !ticketForm.category
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      try {
        // In a real app, this would submit the support ticket
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("Support ticket submitted successfully");
        setShowTicketDialog(false);
        setTicketForm({
          subject: "",
          description: "",
          category: "",
          priority: "medium",
        });
      } catch (error) {
        toast.error("Failed to submit support ticket");
      }
    });
  };

  const handleArticleFeedback = (helpful: boolean) => {
    toast.success(
      helpful
        ? "Thank you for your feedback!"
        : "We'll work on improving this article"
    );
  };

  const handleReadMore = (article: HelpArticle) => {
    setSelectedArticle(article);
    setShowArticleDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Help & Support Center</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find answers to your questions, browse our knowledge base, or contact
          support for assistance
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles, FAQs, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium">Contact Support</h3>
                <p className="text-sm text-gray-600">Submit a support ticket</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll get back to you as soon as
                possible
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={ticketForm.subject}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, subject: e.target.value })
                  }
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={ticketForm.category}
                  onValueChange={(value) =>
                    setTicketForm({ ...ticketForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="account">Account Problem</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={ticketForm.priority}
                  onValueChange={(value: any) =>
                    setTicketForm({ ...ticketForm, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={ticketForm.description}
                  onChange={(e) =>
                    setTicketForm({
                      ...ticketForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Provide detailed information about your issue..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTicketDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitTicket} disabled={isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {isPending ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium">Call Support</h3>
            <p className="text-sm text-gray-600">+27 12 841 2911</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Mail className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium">Email Support</h3>
            <p className="text-sm text-gray-600">support@csir.co.za</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Video className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-medium">Video Tutorials</h3>
            <p className="text-sm text-gray-600">Watch how-to videos</p>
          </CardContent>
        </Card>
      </div>
      {/* Main Content */}
      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="articles">Knowledge Base</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Categories Sidebar */}
            <div className="lg:w-64">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedCategory === category.id
                            ? "bg-blue-100 text-blue-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <category.icon className="h-4 w-4" />
                        <span className="text-sm">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Articles */}
            <div className="flex-1">
              {filteredArticles.length > 0 ? (
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <Card key={article.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {article.title}
                            </CardTitle>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>{article.views} views</span>
                              <span>
                                Updated{" "}
                                {article.lastUpdated.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {article.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{article.content}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              Was this helpful?
                            </span>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArticleFeedback(true)}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                {article.helpful}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArticleFeedback(false)}
                              >
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                {article.notHelpful}
                              </Button>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReadMore(article)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Read More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No articles found matching your search
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-gray-600">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No FAQs found matching your search
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickLinks.map((link, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.open(link.url, "_blank")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <link.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{link.title}</h3>
                      <p className="text-sm text-gray-600">
                        {link.description}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Set up your profile</h4>
                      <p className="text-sm text-gray-600">
                        Complete your profile information, set notification
                        preferences, and configure security settings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Create your first project</h4>
                      <p className="text-sm text-gray-600">
                        Learn how to create and configure a new project, assign
                        team members, and set milestones
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">
                        Understand the stage-gate process
                      </h4>
                      <p className="text-sm text-gray-600">
                        Master the workflow from concept to completion through
                        the four-stage process
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">
                        Manage documents and reviews
                      </h4>
                      <p className="text-sm text-gray-600">
                        Upload documents, organize files, and navigate the gate
                        review process
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">
                        Multi-reviewer assignments
                      </h4>
                      <p className="text-sm text-gray-600">
                        Set up complex review workflows with multiple reviewers
                        and consensus rules
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">
                        Custom reports and analytics
                      </h4>
                      <p className="text-sm text-gray-600">
                        Generate detailed reports, export data, and analyze
                        project performance metrics
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Red flag management</h4>
                      <p className="text-sm text-gray-600">
                        Proactively manage risks with red flags, severity
                        tracking, and resolution workflows
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Integration features</h4>
                      <p className="text-sm text-gray-600">
                        Leverage SharePoint integration, email notifications,
                        and automated workflows
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Role-Specific Guides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-blue-600 mb-2">
                    Project Leads
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Creating and managing projects</li>
                    <li>• Team member assignment</li>
                    <li>• Milestone planning</li>
                    <li>• Document organization</li>
                    <li>• Progress tracking</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-green-600 mb-2">Reviewers</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Conducting gate reviews</li>
                    <li>• Evaluation criteria</li>
                    <li>• Decision making process</li>
                    <li>• Review documentation</li>
                    <li>• Feedback guidelines</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-purple-600 mb-2">
                    Administrators
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• User management</li>
                    <li>• Role assignments</li>
                    <li>• System configuration</li>
                    <li>• Analytics and reporting</li>
                    <li>• Integration setup</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Project Management</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">
                        Planning Phase
                      </h5>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Define clear project objectives</li>
                        <li>• Set realistic milestones</li>
                        <li>• Assign appropriate team members</li>
                        <li>• Establish communication protocols</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">
                        Execution Phase
                      </h5>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Regular progress updates</li>
                        <li>• Proactive risk management</li>
                        <li>• Document version control</li>
                        <li>• Stakeholder communication</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Gate Reviews</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">
                        Preparation
                      </h5>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Complete all deliverables</li>
                        <li>• Organize supporting documents</li>
                        <li>• Prepare presentation materials</li>
                        <li>• Address known issues</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">
                        Review Process
                      </h5>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Thorough evaluation against criteria</li>
                        <li>• Constructive feedback</li>
                        <li>• Clear decision rationale</li>
                        <li>• Actionable recommendations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Technical Support</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>support@csir.co.za</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>+27 12 841 2911</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>08:00 - 17:00 (Mon-Fri)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Process Support</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>stagegate@csir.co.za</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>+27 12 841 3000</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>08:00 - 17:00 (Mon-Fri)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Emergency Support</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-red-400" />
                      <span>+27 12 841 9999</span>
                    </div>
                    <p className="text-gray-600">
                      For critical system issues only
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Platform Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SharePoint Integration</span>
                    <Badge className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Notifications</span>
                    <Badge className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <Badge className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-4">
                    Last updated: {new Date().toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Article Detail Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedArticle.title}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{selectedArticle.views} views</span>
                    <span>
                      Updated {selectedArticle.lastUpdated.toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-1">
                      {selectedArticle.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedArticle.content}
                  </p>

                  {/* Extended content based on article category */}
                  {selectedArticle.category === "projects" && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-semibold">
                        Project Management Steps
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Define project scope and objectives clearly</li>
                        <li>
                          Identify and assign team members with appropriate
                          roles
                        </li>
                        <li>Set up project milestones and deliverables</li>
                        <li>
                          Configure document management and version control
                        </li>
                        <li>
                          Establish communication protocols and meeting
                          schedules
                        </li>
                        <li>Monitor progress and adjust plans as needed</li>
                      </ol>
                    </div>
                  )}

                  {selectedArticle.category === "reviews" && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-semibold">
                        Gate Review Process
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">
                            Decision Types
                          </h4>
                          <ul className="space-y-1 text-gray-700">
                            <li>
                              <strong>GO:</strong> Proceed to next stage
                            </li>
                            <li>
                              <strong>RECYCLE:</strong> Return for improvements
                            </li>
                            <li>
                              <strong>HOLD:</strong> Pause project temporarily
                            </li>
                            <li>
                              <strong>STOP:</strong> Terminate project
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">
                            Evaluation Criteria
                          </h4>
                          <ul className="space-y-1 text-gray-700">
                            <li>Technical feasibility</li>
                            <li>Market potential</li>
                            <li>Resource requirements</li>
                            <li>Risk assessment</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedArticle.category === "documents" && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-semibold">
                        Document Organization Best Practices
                      </h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          <strong>Naming Conventions:</strong> Use consistent,
                          descriptive file names with version numbers (e.g.,
                          ProjectPlan_v2.1.docx)
                        </p>
                        <p>
                          <strong>Folder Structure:</strong> Organize by project
                          stage, document type, and date for easy navigation
                        </p>
                        <p>
                          <strong>Version Control:</strong> Always maintain
                          previous versions and clearly mark the latest version
                        </p>
                        <p>
                          <strong>Access Permissions:</strong> Set appropriate
                          read/write permissions based on team roles
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Was this helpful?
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArticleFeedback(true)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {selectedArticle.helpful}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArticleFeedback(false)}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {selectedArticle.notHelpful}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowArticleDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
