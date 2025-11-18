import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  FolderOpen,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  DollarSign,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  // TEMPORARILY DISABLED FOR TESTING
  // if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
  //   redirect("/dashboard");
  // }

  // Fetch dashboard statistics
  const [
    totalUsers,
    totalProjects,
    activeProjects,
    pendingReviews,
    openRedFlags,
    totalClusters,
    pendingBudgetAllocations,
    pendingExpenses,
    recentActivity,
  ] = await Promise.all([
    db.user.count(),
    db.project.count(),
    db.project.count({ where: { status: "ACTIVE" } }),
    db.gateReview.count({ where: { isCompleted: false } }),
    db.redFlag.count({ where: { status: "OPEN" } }),
    db.cluster.count(),
    // Budget statistics
    (db as any).budgetAllocation.count({ where: { status: "PENDING" } }),
    (db as any).budgetExpense.count({ where: { status: "PENDING" } }),
    db.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        project: true,
      },
    }),
  ]);
  const adminSections = [
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      href: "/admin/users",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Budget Management",
      description: "Approve budget allocations and manage project expenses",
      href: "/admin/budget",
      icon: DollarSign,
      color: "bg-emerald-500",
    },
    {
      title: "Custom Roles",
      description: "Create and manage custom roles with specific permissions",
      href: "/admin/roles",
      icon: Settings,
      color: "bg-purple-500",
    },
    {
      title: "Cluster Management",
      description: "Manage project clusters and categories",
      href: "/admin/clusters",
      icon: FolderOpen,
      color: "bg-green-500",
    },
    {
      title: "Analytics & Reports",
      description: "View system analytics and generate reports",
      href: "/admin/analytics",
      icon: BarChart3,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard" label="Back to Dashboard" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              System overview and management tools
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/admin/budget">
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Budget Management
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              of {totalProjects} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Gate reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Budget Approvals
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {pendingBudgetAllocations}
            </div>
            <p className="text-xs text-muted-foreground">Pending allocations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expense Claims
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pendingExpenses}
            </div>
            <p className="text-xs text-muted-foreground">Pending expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Red Flags
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {openRedFlags}
            </div>
            <p className="text-xs text-muted-foreground">
              Issues requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${section.color} text-white`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>
            Latest actions performed in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 rounded-full">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {activity.user.name} {activity.details}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.project?.name && `in ${activity.project.name} • `}
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
