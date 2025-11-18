import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TemplatesClient } from "@/components/templates/templates-client";
import { UploadTemplate } from "@/components/templates/upload-template";
import { BackButton } from "@/components/ui/back-button";

export default async function TemplatesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch real templates from database
  let documentTemplates: any[] = [];
  let templates: any[] = [];
  let templateStats: any[] = [];

  try {
    documentTemplates = await db.documentTemplate.findMany({
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert to expected format
    templates = documentTemplates.map((dt: any) => ({
      id: dt.id,
      name: dt.name,
      description: dt.description,
      type: dt.category,
      stage: dt.stage,
      fileUrl: dt.filePath,
      fileName: dt.fileName,
      isActive: true,
      createdAt: dt.createdAt,
      updatedAt: dt.updatedAt,
    }));

    // Calculate stats
    templateStats = documentTemplates.reduce((acc: any[], dt: any) => {
      const existing = acc.find((s) => s.type === dt.category);
      if (existing) {
        existing._count++;
      } else {
        acc.push({ type: dt.category, _count: 1 });
      }
      return acc;
    }, []);
  } catch (error) {
    console.error("Error fetching templates:", error);
    // Will fall back to mock templates
  }

  // Get user permissions
  const user = await db.user.findUnique({
    where: { id: session.user.id! },
  });

  const canManageTemplates = !!(
    user && ["ADMIN", "GATEKEEPER"].includes(user.role)
  );

  const mockTemplates = [
    {
      id: "1",
      name: "Business Case Template",
      description: "Standard template for project business cases",
      type: "BUSINESS_CASE" as any,
      stage: "STAGE_0" as any,
      fileUrl: "#",
      fileName: "business-case-template.docx",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "Research Plan Template",
      description: "Template for detailed research planning",
      type: "RESEARCH_PLAN" as any,
      stage: "STAGE_1" as any,
      fileUrl: "#",
      fileName: "research-plan-template.docx",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "Technical Specification",
      description: "Technical requirements and specifications",
      type: "TECHNICAL_SPEC" as any,
      stage: "STAGE_1" as any,
      fileUrl: "#",
      fileName: "tech-spec-template.docx",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      name: "Budget Planning Template",
      description: "Financial planning and budget estimation",
      type: "BUDGET_PLAN" as any,
      stage: null,
      fileUrl: "#",
      fileName: "budget-template.xlsx",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      name: "Risk Assessment Template",
      description: "Risk identification and mitigation planning",
      type: "RISK_ASSESSMENT" as any,
      stage: null,
      fileUrl: "#",
      fileName: "risk-assessment-template.docx",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "6",
      name: "Milestone Report Template",
      description: "Progress reporting and milestone tracking",
      type: "MILESTONE_REPORT" as any,
      stage: null,
      fileUrl: "#",
      fileName: "milestone-report-template.docx",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Use real templates if available, otherwise show mock data
  const displayTemplates = templates.length > 0 ? templates : mockTemplates;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Document Templates
          </h1>
          <p className="text-gray-600">
            Manage and organize project document templates
          </p>
        </div>
        {canManageTemplates && <UploadTemplate />}
      </div>

      <TemplatesClient
        templates={displayTemplates}
        templateStats={templateStats}
        canManageTemplates={canManageTemplates}
      />
    </div>
  );
}
