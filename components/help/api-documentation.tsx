"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Code,
  Search,
  Copy,
  ExternalLink,
  Key,
  Shield,
  Zap,
  FileText,
  Users,
  BarChart3,
  Settings,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  category: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    type: string;
    properties: Record<string, any>;
  };
  responses: {
    status: number;
    description: string;
    example?: any;
  }[];
  example?: {
    request: string;
    response: string;
  };
}

export function APIDocumentation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const endpoints: APIEndpoint[] = [
    {
      method: "GET",
      path: "/api/projects",
      description: "Retrieve a list of projects",
      category: "projects",
      parameters: [
        {
          name: "page",
          type: "number",
          required: false,
          description: "Page number for pagination",
        },
        {
          name: "limit",
          type: "number",
          required: false,
          description: "Number of items per page",
        },
        {
          name: "status",
          type: "string",
          required: false,
          description: "Filter by project status",
        },
      ],
      responses: [
        {
          status: 200,
          description: "Successfully retrieved projects",
          example: {
            projects: [
              {
                id: "proj_123",
                name: "AI Research Project",
                status: "STAGE_1",
                createdAt: "2024-01-15T10:00:00Z",
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 25,
            },
          },
        },
      ],
      example: {
        request: "GET /api/projects?page=1&limit=10",
        response: `{
  "projects": [
    {
      "id": "proj_123",
      "name": "AI Research Project",
      "status": "STAGE_1",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}`,
      },
    },
    {
      method: "POST",
      path: "/api/projects",
      description: "Create a new project",
      category: "projects",
      requestBody: {
        type: "object",
        properties: {
          name: { type: "string", required: true },
          description: { type: "string", required: false },
          clusterId: { type: "string", required: true },
          leadId: { type: "string", required: true },
        },
      },
      responses: [
        {
          status: 201,
          description: "Project created successfully",
        },
        {
          status: 400,
          description: "Invalid request data",
        },
      ],
    },
    {
      method: "GET",
      path: "/api/reviews/{id}",
      description: "Get a specific review by ID",
      category: "reviews",
      parameters: [
        {
          name: "id",
          type: "string",
          required: true,
          description: "Review ID",
        },
      ],
      responses: [
        {
          status: 200,
          description: "Review retrieved successfully",
        },
        {
          status: 404,
          description: "Review not found",
        },
      ],
    },
    {
      method: "POST",
      path: "/api/reviews",
      description: "Submit a new review",
      category: "reviews",
      requestBody: {
        type: "object",
        properties: {
          projectId: { type: "string", required: true },
          decision: { type: "string", required: true },
          score: { type: "number", required: false },
          comments: { type: "string", required: false },
        },
      },
      responses: [
        {
          status: 201,
          description: "Review submitted successfully",
        },
      ],
    },
    {
      method: "GET",
      path: "/api/users/me",
      description: "Get current user profile",
      category: "users",
      responses: [
        {
          status: 200,
          description: "User profile retrieved",
        },
      ],
    },
    {
      method: "PUT",
      path: "/api/users/me",
      description: "Update current user profile",
      category: "users",
      requestBody: {
        type: "object",
        properties: {
          name: { type: "string", required: false },
          email: { type: "string", required: false },
          department: { type: "string", required: false },
        },
      },
      responses: [
        {
          status: 200,
          description: "Profile updated successfully",
        },
      ],
    },
  ];

  const categories = [
    { id: "all", name: "All Endpoints", icon: Code },
    { id: "projects", name: "Projects", icon: FileText },
    { id: "reviews", name: "Reviews", icon: CheckCircle },
    { id: "users", name: "Users", icon: Users },
    { id: "reports", name: "Reports", icon: BarChart3 },
    { id: "auth", name: "Authentication", icon: Shield },
  ];

  const filteredEndpoints = endpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || endpoint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800";
      case "POST":
        return "bg-blue-100 text-blue-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Base URL</h3>
                <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
                  https://stagegate.csir.co.za/api
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">API Version</h3>
                <p className="text-gray-600">Current version: v1</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Response Format</h3>
                <p className="text-gray-600 mb-3">
                  All API responses are in JSON format with the following
                  structure:
                </p>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <pre className="text-sm">
                    {`{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:00:00Z"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Rate Limiting</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">1000</div>
                    <div className="text-sm text-gray-600">
                      Requests per hour
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">100</div>
                    <div className="text-sm text-gray-600">
                      Requests per minute
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">10</div>
                    <div className="text-sm text-gray-600">
                      Concurrent requests
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Error Codes</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-mono">400</span>
                    <span>Bad Request - Invalid request parameters</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-mono">401</span>
                    <span>
                      Unauthorized - Invalid or missing authentication
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-mono">403</span>
                    <span>Forbidden - Insufficient permissions</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-mono">404</span>
                    <span>Not Found - Resource not found</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-mono">429</span>
                    <span>Too Many Requests - Rate limit exceeded</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-mono">500</span>
                    <span>Internal Server Error - Server error</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">
                  API Key Authentication
                </h3>
                <p className="text-gray-600 mb-4">
                  The API uses API key authentication. Include your API key in
                  the Authorization header:
                </p>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <pre className="text-sm">
                    {`Authorization: Bearer YOUR_API_KEY`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Getting an API Key</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <p className="text-gray-700">
                      Navigate to Settings → API Keys in your account
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <p className="text-gray-700">
                      Click "Generate New API Key"
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <p className="text-gray-700">
                      Copy and securely store your API key
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">
                      Security Notice
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Keep your API key secure and never expose it in
                      client-side code. Rotate your keys regularly and revoke
                      unused keys.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">
                  Session-based Authentication
                </h3>
                <p className="text-gray-600 mb-4">
                  For web applications, you can also use session-based
                  authentication:
                </p>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <pre className="text-sm">
                    {`POST /api/auth/login
Content-Type: application/json

{
  "email": "user@csir.co.za",
  "password": "your_password"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search endpoints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={
                        selectedCategory === category.id ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <category.icon className="h-4 w-4 mr-1" />
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <div className="space-y-4">
            {filteredEndpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(endpoint.path)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-gray-600 mb-4">{endpoint.description}</p>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="details">
                      <AccordionTrigger>View Details</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {endpoint.parameters && (
                            <div>
                              <h4 className="font-medium mb-2">Parameters</h4>
                              <div className="space-y-2">
                                {endpoint.parameters.map(
                                  (param, paramIndex) => (
                                    <div
                                      key={paramIndex}
                                      className="flex items-center justify-between p-2 border rounded"
                                    >
                                      <div>
                                        <code className="text-sm">
                                          {param.name}
                                        </code>
                                        <span className="text-sm text-gray-600 ml-2">
                                          ({param.type})
                                        </span>
                                        {param.required && (
                                          <Badge
                                            variant="outline"
                                            className="ml-2 text-xs"
                                          >
                                            required
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-600">
                                        {param.description}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {endpoint.requestBody && (
                            <div>
                              <h4 className="font-medium mb-2">Request Body</h4>
                              <div className="p-3 bg-gray-100 rounded">
                                <pre className="text-sm">
                                  {JSON.stringify(
                                    endpoint.requestBody,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="font-medium mb-2">Responses</h4>
                            <div className="space-y-2">
                              {endpoint.responses.map(
                                (response, responseIndex) => (
                                  <div
                                    key={responseIndex}
                                    className="p-3 border rounded"
                                  >
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Badge
                                        variant={
                                          response.status < 300
                                            ? "default"
                                            : "destructive"
                                        }
                                      >
                                        {response.status}
                                      </Badge>
                                      <span className="text-sm">
                                        {response.description}
                                      </span>
                                    </div>
                                    {response.example && (
                                      <div className="mt-2">
                                        <pre className="text-xs bg-gray-50 p-2 rounded">
                                          {JSON.stringify(
                                            response.example,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {endpoint.example && (
                            <div>
                              <h4 className="font-medium mb-2">Example</h4>
                              <div className="space-y-2">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700">
                                    Request
                                  </h5>
                                  <div className="p-3 bg-gray-100 rounded">
                                    <pre className="text-sm">
                                      {endpoint.example.request}
                                    </pre>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700">
                                    Response
                                  </h5>
                                  <div className="p-3 bg-gray-100 rounded">
                                    <pre className="text-sm">
                                      {endpoint.example.response}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEndpoints.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No endpoints found matching your search
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">JavaScript/Node.js</h3>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <pre className="text-sm">
                    {`// Using fetch API
const response = await fetch('https://stagegate.csir.co.za/api/projects', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);

// Creating a new project
const newProject = await fetch('https://stagegate.csir.co.za/api/projects', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Research Project',
    description: 'Project description',
    clusterId: 'cluster_123',
    leadId: 'user_456'
  })
});`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Python</h3>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <pre className="text-sm">
                    {`import requests

# Set up headers
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

# Get projects
response = requests.get(
    'https://stagegate.csir.co.za/api/projects',
    headers=headers
)

projects = response.json()
print(projects)

# Create a new project
new_project_data = {
    'name': 'New Research Project',
    'description': 'Project description',
    'clusterId': 'cluster_123',
    'leadId': 'user_456'
}

response = requests.post(
    'https://stagegate.csir.co.za/api/projects',
    headers=headers,
    json=new_project_data
)`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">cURL</h3>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <pre className="text-sm">
                    {`# Get projects
curl -X GET "https://stagegate.csir.co.za/api/projects" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Create a new project
curl -X POST "https://stagegate.csir.co.za/api/projects" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "New Research Project",
    "description": "Project description",
    "clusterId": "cluster_123",
    "leadId": "user_456"
  }'`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SDKs and Libraries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Official JavaScript SDK</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Official SDK for JavaScript and Node.js applications
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on GitHub
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Python SDK</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Python library for easy API integration
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on PyPI
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
