"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Users,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Play,
  Download,
} from "lucide-react";

export function UserGuide() {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Platform Overview", icon: BookOpen },
    { id: "projects", title: "Project Management", icon: FileText },
    { id: "reviews", title: "Gate Reviews", icon: HelpCircle },
    { id: "documents", title: "Document Management", icon: FileText },
    { id: "reports", title: "Reports & Analytics", icon: BarChart3 },
    { id: "settings", title: "Settings & Preferences", icon: Settings },
    { id: "roles", title: "User Roles", icon: Users },
  ];

  const workflows = [
    {
      title: "Creating a New Project",
      steps: [
        "Navigate to Projects page",
        "Click 'New Project' button",
        "Fill in project details",
        "Select cluster and team",
        "Set initial milestones",
        "Save and activate project",
      ],
      duration: "5-10 minutes",
      difficulty: "Beginner",
    },
    {
      title: "Conducting a Gate Review",
      steps: [
        "Receive review assignment",
        "Review project documents",
        "Evaluate against criteria",
        "Complete evaluation matrix",
        "Make GO/RECYCLE/HOLD/STOP decision",
        "Submit review with comments",
      ],
      duration: "30-60 minutes",
      difficulty: "Intermediate",
    },
    {
      title: "Managing Project Documents",
      steps: [
        "Access project documents tab",
        "Upload new documents",
        "Organize by categories",
        "Set access permissions",
        "Track version history",
        "Share with team members",
      ],
      duration: "10-15 minutes",
      difficulty: "Beginner",
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs
        value={activeSection}
        onValueChange={setActiveSection}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {sections.map((section) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="text-xs"
            >
              <section.icon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">
                  What is the Stage-Gate Platform?
                </h3>
                <p className="text-gray-600 mb-4">
                  The CSIR Stage-Gate Platform is a comprehensive project
                  management system designed to guide research and development
                  projects through a structured four-stage process. Each stage
                  has specific deliverables and gate review checkpoints to
                  ensure project quality and success.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">0</span>
                  </div>
                  <h4 className="font-medium">Stage 0: Concept</h4>
                  <p className="text-sm text-gray-600">
                    Initial idea development and feasibility assessment
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">1</span>
                  </div>
                  <h4 className="font-medium">Stage 1: Research Planning</h4>
                  <p className="text-sm text-gray-600">
                    Detailed planning and resource allocation
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-orange-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium">Stage 2: Feasibility</h4>
                  <p className="text-sm text-gray-600">
                    Proof of concept and validation
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium">Stage 3: Maturation</h4>
                  <p className="text-sm text-gray-600">
                    Final development and implementation
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Project Management</h4>
                      <p className="text-sm text-gray-600">
                        Create, track, and manage research projects through all
                        stages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Gate Reviews</h4>
                      <p className="text-sm text-gray-600">
                        Structured review process with multiple decision options
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Document Management</h4>
                      <p className="text-sm text-gray-600">
                        SharePoint integration for seamless file management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Analytics & Reporting</h4>
                      <p className="text-sm text-gray-600">
                        Comprehensive reporting and performance analytics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">
                  Creating a New Project
                </h3>
                <div className="space-y-4">
                  {workflows[0].steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Project Lifecycle</h3>
                <Accordion type="single" collapsible>
                  <AccordionItem value="planning">
                    <AccordionTrigger>Planning Phase</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p className="text-gray-600">
                          During the planning phase, you'll define project
                          objectives, scope, and resources.
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>
                            Define clear project objectives and success criteria
                          </li>
                          <li>Identify required resources and team members</li>
                          <li>Set realistic timelines and milestones</li>
                          <li>Establish communication protocols</li>
                          <li>Create initial project documentation</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="execution">
                    <AccordionTrigger>Execution Phase</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p className="text-gray-600">
                          Execute your project plan while monitoring progress
                          and managing risks.
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Regular progress tracking and updates</li>
                          <li>Risk identification and mitigation</li>
                          <li>Team coordination and communication</li>
                          <li>Document management and version control</li>
                          <li>Stakeholder reporting and updates</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="monitoring">
                    <AccordionTrigger>Monitoring & Control</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <p className="text-gray-600">
                          Monitor project performance and make necessary
                          adjustments.
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Track milestone completion and deliverables</li>
                          <li>Monitor budget and resource utilization</li>
                          <li>Manage scope changes and requirements</li>
                          <li>Quality assurance and testing</li>
                          <li>Prepare for gate reviews</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gate Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Review Process</h3>
                <p className="text-gray-600 mb-4">
                  Gate reviews are critical decision points that determine
                  whether a project should proceed to the next stage. Each
                  review evaluates the project against predefined criteria.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-green-600">GO</h4>
                  <p className="text-sm text-gray-600">Proceed to next stage</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ArrowRight className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h4 className="font-medium text-yellow-600">RECYCLE</h4>
                  <p className="text-sm text-gray-600">
                    Return to current stage
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-blue-600">HOLD</h4>
                  <p className="text-sm text-gray-600">
                    Pause project temporarily
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h4 className="font-medium text-red-600">STOP</h4>
                  <p className="text-sm text-gray-600">Terminate project</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Review Preparation</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">
                      For Project Teams
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Complete all stage deliverables</li>
                      <li>• Organize supporting documentation</li>
                      <li>• Prepare presentation materials</li>
                      <li>• Address known issues and risks</li>
                      <li>• Schedule review meeting</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">
                      For Reviewers
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Review all project documents</li>
                      <li>• Understand evaluation criteria</li>
                      <li>• Prepare questions and feedback</li>
                      <li>• Complete evaluation matrix</li>
                      <li>• Provide constructive recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">
                  SharePoint Integration
                </h3>
                <p className="text-gray-600 mb-4">
                  All project documents are automatically stored and organized
                  in SharePoint, providing seamless access, version control, and
                  collaboration features.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Document Categories</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Project Plans</Badge>
                      <span className="text-sm text-gray-600">
                        Planning documents and schedules
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Research Reports</Badge>
                      <span className="text-sm text-gray-600">
                        Research findings and analysis
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Technical Specs</Badge>
                      <span className="text-sm text-gray-600">
                        Technical specifications and designs
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Review Materials</Badge>
                      <span className="text-sm text-gray-600">
                        Gate review presentations and evaluations
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Best Practices</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Use descriptive file names with version numbers</li>
                    <li>• Organize documents by project stage</li>
                    <li>• Set appropriate access permissions</li>
                    <li>• Maintain version history and change logs</li>
                    <li>• Regular backup and archival procedures</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">
                  File Management Workflow
                </h3>
                <div className="space-y-4">
                  {workflows[2].steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Available Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Project Summary</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Comprehensive overview of project status, milestones, and
                      deliverables
                    </p>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Budget Analysis</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Financial tracking, budget utilization, and cost analysis
                    </p>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Team Performance</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Team productivity metrics and performance indicators
                    </p>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Gate Review Analytics</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Review outcomes, decision patterns, and success rates
                    </p>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Risk Assessment</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Red flag analysis, risk trends, and mitigation tracking
                    </p>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Custom Reports</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Build custom reports with specific metrics and filters
                    </p>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Export Formats</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>PDF</Badge>
                  <Badge>Excel (.xlsx)</Badge>
                  <Badge>CSV</Badge>
                  <Badge>PowerPoint (.pptx)</Badge>
                  <Badge>JSON</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Profile Settings</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Personal information and contact details</li>
                    <li>• Profile picture and bio</li>
                    <li>• Department and position</li>
                    <li>• Skills and expertise areas</li>
                    <li>• Timezone and language preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Notification Settings
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Email notification preferences</li>
                    <li>• Review assignment alerts</li>
                    <li>• Project update notifications</li>
                    <li>• Red flag and milestone reminders</li>
                    <li>• Weekly digest emails</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Security Settings
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Password management</li>
                    <li>• Two-factor authentication</li>
                    <li>• Active sessions monitoring</li>
                    <li>• Login history and security logs</li>
                    <li>• Privacy and data preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Display Preferences
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Dashboard layout customization</li>
                    <li>• Theme and color preferences</li>
                    <li>• Data display formats</li>
                    <li>• Default view settings</li>
                    <li>• Accessibility options</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Roles & Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-red-100 text-red-800">Admin</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Administrator</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Full system access and management capabilities
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• User management and role assignments</li>
                    <li>• System configuration and settings</li>
                    <li>• All project and review access</li>
                    <li>• Analytics and reporting</li>
                    <li>• Integration management</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-purple-100 text-purple-800">
                      Gatekeeper
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">Gatekeeper</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Review management and oversight responsibilities
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Assign reviewers to projects</li>
                    <li>• Conduct gate reviews</li>
                    <li>• View all projects and reviews</li>
                    <li>• Generate reports and analytics</li>
                    <li>• Manage review processes</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-blue-100 text-blue-800">
                      Project Lead
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">Project Lead</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Project creation and team management
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Create and manage projects</li>
                    <li>• Assign team members</li>
                    <li>• Upload and organize documents</li>
                    <li>• Track project progress</li>
                    <li>• Generate project reports</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-green-100 text-green-800">
                      Reviewer
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">Reviewer</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Gate review participation and evaluation
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Conduct assigned gate reviews</li>
                    <li>• Access review materials</li>
                    <li>• Complete evaluation matrices</li>
                    <li>• Provide feedback and recommendations</li>
                    <li>• View assigned projects</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Researcher
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">Researcher</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Project participation and contribution
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Participate in assigned projects</li>
                    <li>• Upload project documents</li>
                    <li>• View project information</li>
                    <li>• Raise red flags and issues</li>
                    <li>• Collaborate with team members</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-gray-100 text-gray-800">User</Badge>
                  </div>
                  <h4 className="font-medium mb-2">Basic User</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Limited access for viewing and basic interactions
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• View assigned projects</li>
                    <li>• Access shared documents</li>
                    <li>• Basic profile management</li>
                    <li>• Notification preferences</li>
                    <li>• Limited reporting access</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflows.map((workflow, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{workflow.title}</h4>
                  <Badge
                    variant={
                      workflow.difficulty === "Beginner"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {workflow.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {workflow.duration}
                </p>
                <div className="space-y-2 mb-4">
                  {workflow.steps.slice(0, 3).map((step, stepIndex) => (
                    <div key={stepIndex} className="text-sm text-gray-600">
                      {stepIndex + 1}. {step}
                    </div>
                  ))}
                  {workflow.steps.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{workflow.steps.length - 3} more steps...
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Workflow
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
