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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Download,
} from "lucide-react";
import { hasPermission, UserRole } from "@/lib/permissions";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

export default async function ReviewsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Get user's role to determine what reviews they can see
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  // Build query based on user role
  const whereClause =
    user?.role === "ADMIN" || user?.role === "GATEKEEPER"
      ? {} // Admins and gatekeepers can see all reviews
      : { reviewerId: session.user.id }; // Others only see their assigned reviews

  const [pendingReviews, completedReviews] = await Promise.all([
    db.gateReview.findMany({
      where: {
        ...whereClause,
        isCompleted: false,
      },
      include: {
        project: {
          include: {
            lead: true,
            cluster: true,
          },
        },
        reviewer: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.gateReview.findMany({
      where: {
        ...whereClause,
        isCompleted: true,
      },
      include: {
        project: {
          include: {
            lead: true,
            cluster: true,
          },
        },
        reviewer: true,
      },
      orderBy: { reviewDate: "desc" },
      take: 20,
    }),
  ]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "STAGE_0":
        return "bg-blue-100 text-blue-800";
      case "STAGE_1":
        return "bg-purple-100 text-purple-800";
      case "STAGE_2":
        return "bg-green-100 text-green-800";
      case "STAGE_3":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "GO":
        return "bg-green-100 text-green-800";
      case "RECYCLE":
        return "bg-yellow-100 text-yellow-800";
      case "HOLD":
        return "bg-blue-100 text-blue-800";
      case "STOP":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStage = (stage: string) => {
    switch (stage) {
      case "STAGE_0":
        return "Stage 0: Concept";
      case "STAGE_1":
        return "Stage 1: Research Planning";
      case "STAGE_2":
        return "Stage 2: Feasibility";
      case "STAGE_3":
        return "Stage 3: Maturation";
      default:
        return stage;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton href="/dashboard" label="Back to Dashboard" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gate Reviews</h1>
            <p className="text-gray-600">
              Manage and conduct gate reviews for stage-gate projects
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(user?.role as UserRole, "canExportReviews") && (
            <Link href="/reviews/export">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Reviews
              </Button>
            </Link>
          )}
          <Link href="/projects">
            <Button>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              View Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  GO Decisions
                </p>
                <p className="text-2xl font-bold">
                  {
                    completedReviews.filter((r: any) => r.decision === "GO")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  STOP Decisions
                </p>
                <p className="text-2xl font-bold">
                  {
                    completedReviews.filter((r: any) => r.decision === "STOP")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Reviews ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed Reviews ({completedReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No pending reviews at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingReviews.map((review: any) => (
                <Card
                  key={review.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className={getStageColor(review.stage)}>
                        {formatStage(review.stage)}
                      </Badge>
                      <Badge variant="outline" className="text-yellow-600">
                        Pending
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {review.project.name}
                    </CardTitle>
                    <CardDescription>
                      {review.project.projectId} • {review.project.cluster.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Project Lead:</strong>{" "}
                        {review.project.lead.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Reviewer:</strong> {review.reviewer.name}
                      </div>
                      <div className="pt-2 space-y-2">
                        <Link href={`/reviews/${review.project.id}`}>
                          <Button className="w-full">
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Conduct Review
                          </Button>
                        </Link>
                        <Link href={`/projects/${review.project.id}/review`}>
                          <Button variant="outline" className="w-full">
                            <Users className="h-4 w-4 mr-2" />
                            Review Dashboard
                          </Button>
                        </Link>
                        <Link href={`/projects/${review.project.id}`}>
                          <Button variant="outline" className="w-full">
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedReviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No completed reviews to display.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedReviews.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {review.project.name}
                          </h3>
                          <Badge className={getStageColor(review.stage)}>
                            {formatStage(review.stage)}
                          </Badge>
                          <Badge className={getDecisionColor(review.decision!)}>
                            {review.decision}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            {review.project.projectId} •{" "}
                            {review.project.cluster.name}
                          </div>
                          <div>
                            <strong>Reviewer:</strong> {review.reviewer.name}
                          </div>
                          <div>
                            <strong>Review Date:</strong>{" "}
                            {review.reviewDate?.toLocaleDateString()}
                          </div>
                          {review.score && (
                            <div>
                              <strong>Score:</strong> {review.score}/10
                            </div>
                          )}
                        </div>
                        {review.comments && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              {review.comments}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Link href={`/projects/${review.project.id}`}>
                          <Button variant="outline">View Project</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
