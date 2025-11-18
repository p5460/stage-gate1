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
} from "lucide-react";

interface NavigationItem {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  href: string;
}

export function HelpHome() {
  const navigationItems: NavigationItem[] = [
    {
      title: "Knowledge Base",
      description: "Browse articles, FAQs, and guides",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
      href: "/help/knowledge-base",
    },
    {
      title: "User Guide",
      description: "Comprehensive platform documentation",
      icon: FileText,
      color: "bg-green-100 text-green-600",
      href: "/help/user-guide",
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs",
      icon: Video,
      color: "bg-purple-100 text-purple-600",
      href: "/help/tutorials",
    },
    {
      title: "API Documentation",
      description: "Technical documentation for developers",
      icon: FileText,
      color: "bg-orange-100 text-orange-600",
      href: "/help/api",
    },
    {
      title: "System Status",
      description: "Real-time system health and performance",
      icon: Zap,
      color: "bg-yellow-100 text-yellow-600",
      href: "/help/status",
    },
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: MessageSquare,
      color: "bg-red-100 text-red-600",
      href: "/help/contact",
    },
  ];

  const quickActions = [
    {
      title: "Submit Support Ticket",
      description: "Report issues or request help",
      icon: MessageSquare,
      href: "/help/contact",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Call Support",
      description: "+27 12 841 2911",
      icon: Phone,
      href: "tel:+27128412911",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Email Support",
      description: "support@csir.co.za",
      icon: Mail,
      href: "mailto:support@csir.co.za",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Search Help",
      description: "Find answers quickly",
      icon: Search,
      href: "/help/knowledge-base",
      color: "bg-gray-600 hover:bg-gray-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
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
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className={`h-auto p-6 flex flex-col items-center space-y-3 text-white border-0 w-full ${action.color}`}
                >
                  <action.icon className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm opacity-90">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>

          {/* Main Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navigationItems.map((item, index) => (
              <Link key={index} href={item.href}>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 h-full">
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
              </Link>
            ))}
          </div>

          {/* Popular Resources */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Popular Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/help/user-guide">
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
              </Link>

              <Link href="/help/tutorials">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded">
                        <Video className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          Project Creation Tutorial
                        </h4>
                        <p className="text-sm text-gray-600">
                          Learn to create your first project
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/help/user-guide">
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
              </Link>
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Operational</span>
                  </div>
                  <Link href="/help/status">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
