"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Video,
  FileText,
  Zap,
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Search,
  ExternalLink,
  Send,
  ArrowLeft,
  Home,
} from "lucide-react";
import { SystemStatus } from "./system-status";
import { APIDocumentation } from "./api-documentation";
import { VideoTutorials } from "./video-tutorials";
import { UserGuide } from "./user-guide";
import { HelpCenter } from "./help-center";
import { useState } from "react";

type HelpSection =
  | "home"
  | "knowledge-base"
  | "user-guide"
  | "video-tutorials"
  | "api-docs"
  | "system-status"
  | "contact";

interface NavigationItem {
  id: HelpSection;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

export function HelpNavigation() {
  const [currentSection, setCurrentSection] = useState<HelpSection>("home");

  const navigationItems: NavigationItem[] = [
    {
      id: "knowledge-base",
      title: "Knowledge Base",
      description: "Browse articles, FAQs, and guides",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "user-guide",
      title: "User Guide",
      description: "Comprehensive platform documentation",
      icon: FileText,
      color: "bg-green-100 text-green-600",
    },
    {
      id: "video-tutorials",
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs",
      icon: Video,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "api-docs",
      title: "API Documentation",
      description: "Technical documentation for developers",
      icon: FileText,
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "system-status",
      title: "System Status",
      description: "Real-time system health and performance",
      icon: Zap,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      id: "contact",
      title: "Contact Support",
      description: "Get help from our support team",
      icon: MessageSquare,
      color: "bg-red-100 text-red-600",
    },
  ];

  const quickActions = [
    {
      title: "Submit Support Ticket",
      description: "Report issues or request help",
      icon: MessageSquare,
      action: () => setCurrentSection("contact"),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Call Support",
      description: "+27 12 841 2911",
      icon: Phone,
      action: () => window.open("tel:+27128412911"),
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Email Support",
      description: "support@csir.co.za",
      icon: Mail,
      action: () => window.open("mailto:support@csir.co.za"),
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Search Help",
      description: "Find answers quickly",
      icon: Search,
      action: () => setCurrentSection("knowledge-base"),
      color: "bg-gray-600 hover:bg-gray-700",
    },
  ];

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "knowledge-base":
        return <HelpCenter />;
      case "user-guide":
        return <UserGuide />;
      case "video-tutorials":
        return <VideoTutorials />;
      case "api-docs":
        return <APIDocumentation />;
      case "system-status":
        return <SystemStatus />;
      case "contact":
        return <ContactSupport />;
      default:
        return <HelpHome />;
    }
  };

  const HelpHome = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Help & Support Center
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Welcome to the CSIR Stage-Gate Platform help center. Find answers,
          learn new features, and get the support you need.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className={`h-auto p-6 flex flex-col items-center space-y-3 text-white border-0 ${action.color}`}
            onClick={action.action}
          >
            <action.icon className="h-8 w-8" />
            <div className="text-center">
              <div className="font-medium">{action.title}</div>
              <div className="text-sm opacity-90">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>

      {/* Main Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navigationItems.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => setCurrentSection(item.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Resources */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Popular Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Getting Started Guide</h4>
                  <p className="text-sm text-gray-600">
                    New to the platform? Start here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded">
                  <Video className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Project Creation Tutorial</h4>
                  <p className="text-sm text-gray-600">
                    Learn to create your first project
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Gate Review Process</h4>
                  <p className="text-sm text-gray-600">
                    Understanding reviews and decisions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Status Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                System Status
              </h3>
              <p className="text-gray-600">All systems are operational</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Operational</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSection("system-status")}
              >
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ContactSupport = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Contact Support</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Need help? Our support team is here to assist you with any questions
          or issues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Methods */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Phone Support</div>
                    <div className="text-sm text-gray-600">+27 12 841 2911</div>
                    <div className="text-xs text-gray-500">
                      Mon-Fri, 08:00-17:00
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Email Support</div>
                    <div className="text-sm text-gray-600">
                      support@csir.co.za
                    </div>
                    <div className="text-xs text-gray-500">
                      Response within 24 hours
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Support Tickets</div>
                    <div className="text-sm text-gray-600">
                      Submit detailed requests
                    </div>
                    <div className="text-xs text-gray-500">
                      Track progress online
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Emergency Support</h3>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded">
                  <Phone className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium">Emergency Hotline</div>
                  <div className="text-sm text-gray-600">+27 12 841 9999</div>
                  <div className="text-xs text-gray-500">
                    Critical issues only, 24/7
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Form */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Submit a Support Request
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a category</option>
                  <option value="technical">Technical Issue</option>
                  <option value="account">Account Problem</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide detailed information about your issue..."
                />
              </div>

              <Button className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Submit Support Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      {currentSection !== "home" && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSection("home")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Help Center
              </Button>
              <div className="text-sm text-gray-500">
                <Home className="h-4 w-4 inline mr-1" />
                Help Center
                <span className="mx-2">›</span>
                <span className="text-gray-900">
                  {navigationItems.find((item) => item.id === currentSection)
                    ?.title || "Support"}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSection("contact")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderCurrentSection()}
      </div>
    </div>
  );
}
