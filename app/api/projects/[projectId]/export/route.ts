import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { format } from "date-fns";

// Helper function to escape CSV values
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper function to generate CSV content
function generateCSV(project: any, user: any): string {
  const lines: string[] = [];

  // Header information
  lines.push("Project Export Report");
  lines.push(`Exported on: ${new Date().toISOString()}`);
  lines.push(`Exported by: ${user.name} (${user.email})`);
  lines.push("");

  // Project basic information
  lines.push("PROJECT INFORMATION");
  lines.push("Field,Value");
  lines.push(`Project ID,${escapeCSV(project.projectId)}`);
  lines.push(`Name,${escapeCSV(project.name)}`);
  lines.push(`Description,${escapeCSV(project.description)}`);
  lines.push(`Current Stage,${escapeCSV(project.currentStage)}`);
  lines.push(`Status,${escapeCSV(project.status)}`);
  lines.push(`Cluster,${escapeCSV(project.cluster?.name)}`);
  lines.push(`Lead Researcher,${escapeCSV(project.lead?.name)}`);
  lines.push(`Lead Email,${escapeCSV(project.lead?.email)}`);
  lines.push(`Budget,${escapeCSV(project.budget)}`);
  lines.push(`Duration,${escapeCSV(project.duration)}`);
  lines.push(`Start Date,${escapeCSV(project.startDate)}`);
  lines.push(`Created At,${escapeCSV(project.createdAt)}`);
  lines.push(`Updated At,${escapeCSV(project.updatedAt)}`);
  lines.push("");

  // Project statistics
  lines.push("PROJECT STATISTICS");
  lines.push("Metric,Count");
  lines.push(`Total Documents,${project._count?.documents || 0}`);
  lines.push(`Open Red Flags,${project._count?.redFlags || 0}`);
  lines.push(`Team Members,${project._count?.members || 0}`);
  lines.push("");

  // Team members
  if (project.members && project.members.length > 0) {
    lines.push("TEAM MEMBERS");
    lines.push("Name,Email,Role,Joined Date");
    project.members.forEach((member: any) => {
      lines.push(
        `${escapeCSV(member.user?.name)},${escapeCSV(member.user?.email)},${escapeCSV(member.role)},${escapeCSV(member.createdAt)}`
      );
    });
    lines.push("");
  }

  // Documents
  if (project.documents && project.documents.length > 0) {
    lines.push("DOCUMENTS");
    lines.push("Name,Type,Uploaded By,Upload Date");
    project.documents.forEach((doc: any) => {
      lines.push(
        `${escapeCSV(doc.name)},${escapeCSV(doc.type)},${escapeCSV(doc.uploader?.name)},${escapeCSV(doc.createdAt)}`
      );
    });
    lines.push("");
  }

  // Gate reviews
  if (project.gateReviews && project.gateReviews.length > 0) {
    lines.push("GATE REVIEWS");
    lines.push("Stage,Status,Reviewer,Review Date,Score,Comments");
    project.gateReviews.forEach((review: any) => {
      lines.push(
        `${escapeCSV(review.stage)},${escapeCSV(review.status)},${escapeCSV(review.reviewer?.name)},${escapeCSV(review.createdAt)},${escapeCSV(review.score)},${escapeCSV(review.comments)}`
      );
    });
    lines.push("");
  }

  // Red flags
  if (project.redFlags && project.redFlags.length > 0) {
    lines.push("RED FLAGS");
    lines.push(
      "Title,Description,Severity,Status,Raised By,Date Raised,Resolution"
    );
    project.redFlags.forEach((flag: any) => {
      lines.push(
        `${escapeCSV(flag.title)},${escapeCSV(flag.description)},${escapeCSV(flag.severity)},${escapeCSV(flag.status)},${escapeCSV(flag.raisedBy?.name)},${escapeCSV(flag.createdAt)},${escapeCSV(flag.resolution)}`
      );
    });
    lines.push("");
  }

  // Recent activities (last 20)
  if (project.activities && project.activities.length > 0) {
    lines.push("RECENT ACTIVITIES");
    lines.push("Action,User,Details,Date");
    project.activities.slice(0, 20).forEach((activity: any) => {
      lines.push(
        `${escapeCSV(activity.action)},${escapeCSV(activity.user?.name)},${escapeCSV(activity.details)},${escapeCSV(activity.createdAt)}`
      );
    });
  }

  return lines.join("\n");
}

// Helper function to generate PDF report
async function generateProjectPDF(
  project: any,
  user: any
): Promise<NextResponse> {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Create HTML content for PDF generation
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Project Report - ${project.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .info-item strong {
            color: #495057;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .list-item {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .list-item h4 {
            margin: 0 0 10px 0;
            color: #495057;
        }
        .list-item p {
            margin: 5px 0;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 20px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>PROJECT EXPORT REPORT</h1>
        <p><strong>Project:</strong> ${project.name}</p>
        <p><strong>Project ID:</strong> ${project.projectId}</p>
        <p><strong>Generated:</strong> ${format(new Date(), "PPP 'at' p")}</p>
        <p><strong>Exported by:</strong> ${user.name} (${user.email})</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="info-grid">
            <div class="info-item">
                <strong>Name:</strong><br>${project.name}
            </div>
            <div class="info-item">
                <strong>Current Stage:</strong><br>${project.currentStage?.replace("STAGE_", "Stage ") || "Not specified"}
            </div>
            <div class="info-item">
                <strong>Status:</strong><br>
                <span class="badge badge-info">${project.status?.replace(/_/g, " ") || "Unknown"}</span>
            </div>
            <div class="info-item">
                <strong>Cluster:</strong><br>${project.cluster?.name || "No cluster assigned"}
            </div>
            <div class="info-item">
                <strong>Lead Researcher:</strong><br>${project.lead?.name || "No lead assigned"}
            </div>
            <div class="info-item">
                <strong>Budget:</strong><br>${project.budget ? formatCurrency(project.budget) : "Not specified"}
            </div>
        </div>
        ${project.description ? `<div class="info-item"><strong>Description:</strong><br>${project.description}</div>` : ""}
    </div>

    <div class="section">
        <h2>Project Statistics</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${project._count?.documents || 0}</div>
                <div class="stat-label">Total Documents</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${project._count?.redFlags || 0}</div>
                <div class="stat-label">Open Red Flags</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${project._count?.members || 0}</div>
                <div class="stat-label">Team Members</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${project.gateReviews?.length || 0}</div>
                <div class="stat-label">Gate Reviews</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Team Members</h2>
        ${
          project.members && project.members.length > 0
            ? project.members
                .map(
                  (member: any) => `
                <div class="list-item">
                    <h4>${member.user?.name || "Unknown"}</h4>
                    <p><strong>Email:</strong> ${member.user?.email || "No email"}</p>
                    <p><strong>Role:</strong> <span class="badge badge-info">${member.role || "Not specified"}</span></p>
                    <p><strong>Joined:</strong> ${member.createdAt ? format(new Date(member.createdAt), "PPP") : "Unknown"}</p>
                </div>`
                )
                .join("")
            : "<p>No team members assigned</p>"
        }
    </div>

    <div class="section">
        <h2>Documents</h2>
        ${
          project.documents && project.documents.length > 0
            ? project.documents
                .map(
                  (doc: any) => `
                <div class="list-item">
                    <h4>${doc.name}</h4>
                    <p><strong>Type:</strong> <span class="badge badge-info">${doc.type || "Unknown"}</span></p>
                    <p><strong>Uploaded by:</strong> ${doc.uploader?.name || "Unknown"}</p>
                    <p><strong>Upload Date:</strong> ${doc.createdAt ? format(new Date(doc.createdAt), "PPP") : "Unknown"}</p>
                </div>`
                )
                .join("")
            : "<p>No documents uploaded</p>"
        }
    </div>

    <div class="section">
        <h2>Gate Reviews</h2>
        ${
          project.gateReviews && project.gateReviews.length > 0
            ? project.gateReviews
                .map(
                  (review: any) => `
                <div class="list-item">
                    <h4>Stage: ${review.stage || "Unknown"}</h4>
                    <p><strong>Status:</strong> <span class="badge badge-${review.status === "APPROVED" ? "success" : review.status === "REJECTED" ? "danger" : "warning"}">${review.status || "Unknown"}</span></p>
                    <p><strong>Reviewer:</strong> ${review.reviewer?.name || "Unknown"}</p>
                    <p><strong>Score:</strong> ${review.score || "Not scored"}</p>
                    <p><strong>Comments:</strong> ${review.comments || "No comments"}</p>
                    <p><strong>Review Date:</strong> ${review.createdAt ? format(new Date(review.createdAt), "PPP") : "Unknown"}</p>
                </div>`
                )
                .join("")
            : "<p>No gate reviews completed</p>"
        }
    </div>

    <div class="section">
        <h2>Red Flags</h2>
        ${
          project.redFlags && project.redFlags.length > 0
            ? project.redFlags
                .map(
                  (flag: any) => `
                <div class="list-item">
                    <h4>${flag.title || "Untitled"}</h4>
                    <p><strong>Description:</strong> ${flag.description || "No description"}</p>
                    <p><strong>Severity:</strong> <span class="badge badge-${flag.severity === "HIGH" ? "danger" : flag.severity === "MEDIUM" ? "warning" : "info"}">${flag.severity || "Unknown"}</span></p>
                    <p><strong>Status:</strong> <span class="badge badge-${flag.status === "RESOLVED" ? "success" : "warning"}">${flag.status || "Unknown"}</span></p>
                    <p><strong>Raised by:</strong> ${flag.raisedBy?.name || "Unknown"}</p>
                    <p><strong>Date Raised:</strong> ${flag.createdAt ? format(new Date(flag.createdAt), "PPP") : "Unknown"}</p>
                    ${flag.resolution ? `<p><strong>Resolution:</strong> ${flag.resolution}</p>` : ""}
                </div>`
                )
                .join("")
            : "<p>No red flags raised</p>"
        }
    </div>

    <div class="section">
        <h2>Recent Activities</h2>
        ${
          project.activities && project.activities.length > 0
            ? project.activities
                .slice(0, 10)
                .map(
                  (activity: any) => `
                <div class="list-item">
                    <h4>${activity.action?.replace(/_/g, " ") || "Unknown action"}</h4>
                    <p><strong>User:</strong> ${activity.user?.name || "Unknown"}</p>
                    <p><strong>Details:</strong> ${activity.details || "No details"}</p>
                    <p><strong>Date:</strong> ${activity.createdAt ? format(new Date(activity.createdAt), "PPP 'at' p") : "Unknown"}</p>
                </div>`
                )
                .join("")
            : "<p>No recent activities</p>"
        }
    </div>

    <div class="footer">
        <p>Report generated by Stage Gate Management System</p>
        <p>Confidential - For internal use only</p>
    </div>
</body>
</html>`;

  try {
    // Use puppeteer to generate PDF from HTML
    const puppeteer = require("puppeteer");

    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    });

    console.log("Creating new page...");
    const page = await browser.newPage();

    console.log("Setting content...");
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    console.log("Generating PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    console.log("Closing browser...");
    await browser.close();

    console.log("PDF generated successfully");
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_report.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    console.error("Error details:", error.message);
    // Fallback to HTML format if PDF generation fails
    // This HTML can be opened in a browser and printed to PDF
    console.log("Falling back to HTML format");

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_report.html"`,
      },
    });
  }
}

// Helper function to generate PowerPoint presentation
async function generateProjectPowerPoint(
  project: any,
  user: any
): Promise<NextResponse> {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const content = {
    title: `Project Report: ${project.name}`,
    subtitle: `Project ID: ${project.projectId}`,
    generatedAt: format(new Date(), "PPP 'at' p"),
    exportedBy: `${user.name} (${user.email})`,
    slides: [
      {
        title: "Project Overview",
        type: "overview",
        content: {
          projectName: project.name,
          projectId: project.projectId,
          description: project.description || "No description provided",
          currentStage:
            project.currentStage?.replace("STAGE_", "Stage ") ||
            "Not specified",
          status: project.status?.replace(/_/g, " ") || "Unknown",
          cluster: project.cluster?.name || "No cluster assigned",
          leadResearcher: project.lead?.name || "No lead assigned",
          budget: project.budget
            ? formatCurrency(project.budget)
            : "Not specified",
          duration: project.duration || "Not specified",
          startDate: project.startDate
            ? format(new Date(project.startDate), "PPP")
            : "Not specified",
        },
      },
      {
        title: "Project Statistics",
        type: "statistics",
        content: {
          metrics: [
            { label: "Total Documents", value: project._count?.documents || 0 },
            { label: "Open Red Flags", value: project._count?.redFlags || 0 },
            { label: "Team Members", value: project._count?.members || 0 },
            { label: "Gate Reviews", value: project.gateReviews?.length || 0 },
            {
              label: "Recent Activities",
              value: project.activities?.length || 0,
            },
          ],
        },
      },
      {
        title: "Team Members",
        type: "team",
        content: {
          members:
            project.members?.map((member: any) => ({
              name: member.user?.name || "Unknown",
              email: member.user?.email || "No email",
              role: member.role || "Not specified",
              joinDate: member.createdAt
                ? format(new Date(member.createdAt), "MMM yyyy")
                : "Unknown",
            })) || [],
        },
      },
      {
        title: "Document Summary",
        type: "documents",
        content: {
          totalDocuments: project.documents?.length || 0,
          documents:
            project.documents?.slice(0, 10).map((doc: any) => ({
              name: doc.name,
              type: doc.type || "Unknown",
              uploader: doc.uploader?.name || "Unknown",
              uploadDate: doc.createdAt
                ? format(new Date(doc.createdAt), "MMM dd, yyyy")
                : "Unknown",
            })) || [],
        },
      },
      {
        title: "Gate Reviews Status",
        type: "reviews",
        content: {
          totalReviews: project.gateReviews?.length || 0,
          reviews:
            project.gateReviews?.map((review: any) => ({
              stage: review.stage || "Unknown",
              status: review.status || "Unknown",
              reviewer: review.reviewer?.name || "Unknown",
              score: review.score || "Not scored",
              reviewDate: review.createdAt
                ? format(new Date(review.createdAt), "MMM dd, yyyy")
                : "Unknown",
            })) || [],
        },
      },
      {
        title: "Risk Management",
        type: "risks",
        content: {
          totalRedFlags: project.redFlags?.length || 0,
          openRedFlags:
            project.redFlags?.filter((flag: any) => flag.status === "OPEN")
              .length || 0,
          redFlags:
            project.redFlags?.slice(0, 5).map((flag: any) => ({
              title: flag.title || "Untitled",
              severity: flag.severity || "Unknown",
              status: flag.status || "Unknown",
              raisedBy: flag.raisedBy?.name || "Unknown",
              dateRaised: flag.createdAt
                ? format(new Date(flag.createdAt), "MMM dd, yyyy")
                : "Unknown",
            })) || [],
        },
      },
      {
        title: "Recent Activity",
        type: "activity",
        content: {
          totalActivities: project.activities?.length || 0,
          recentActivities:
            project.activities?.slice(0, 8).map((activity: any) => ({
              action: activity.action?.replace(/_/g, " ") || "Unknown action",
              user: activity.user?.name || "Unknown",
              details: activity.details || "No details",
              date: activity.createdAt
                ? format(new Date(activity.createdAt), "MMM dd")
                : "Unknown",
            })) || [],
        },
      },
      {
        title: "Project Health Summary",
        type: "summary",
        content: {
          overallStatus: project.status?.replace(/_/g, " ") || "Unknown",
          currentStage:
            project.currentStage?.replace("STAGE_", "Stage ") ||
            "Not specified",
          keyMetrics: [
            { label: "Team Size", value: project._count?.members || 0 },
            { label: "Documents", value: project._count?.documents || 0 },
            { label: "Open Issues", value: project._count?.redFlags || 0 },
            {
              label: "Completion Rate",
              value:
                project.gateReviews?.length > 0
                  ? `${Math.round((project.gateReviews.filter((r: any) => r.status === "APPROVED").length / project.gateReviews.length) * 100)}%`
                  : "0%",
            },
          ],
          recommendations: [
            project._count?.redFlags > 0
              ? "Address open red flags"
              : "No critical issues",
            project._count?.documents < 3
              ? "Consider adding more documentation"
              : "Good documentation coverage",
            project._count?.members < 2
              ? "Consider expanding team"
              : "Adequate team size",
          ],
        },
      },
    ],
  };

  const pptxContent = JSON.stringify(content, null, 2);

  return new NextResponse(pptxContent, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_presentation.json"`,
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = await params;
    const url = new URL(req.url);
    const exportFormat = url.searchParams.get("format") || "json";

    // Get complete project data
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        cluster: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            createdAt: true,
            uploader: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        gateReviews: {
          include: {
            reviewer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        redFlags: {
          include: {
            raisedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        activities: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            documents: true,
            redFlags: { where: { status: "OPEN" } },
            members: true,
          },
        },
      },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    if (exportFormat === "csv") {
      // Generate CSV format
      const csvData = generateCSV(project, session.user);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_export.csv"`,
        },
      });
    } else if (exportFormat === "pdf") {
      // Generate PDF format
      return await generateProjectPDF(project, session.user);
    } else if (exportFormat === "pptx") {
      // Generate PowerPoint format
      return await generateProjectPowerPoint(project, session.user);
    } else {
      // Default JSON format
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exportedBy: {
            name: session.user.name,
            email: session.user.email,
          },
        },
        project: {
          ...project,
          // Remove sensitive internal IDs
          id: undefined,
          leadId: undefined,
          clusterId: undefined,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_export.json"`,
        },
      });
    }
  } catch (error) {
    console.error("[PROJECT_EXPORT]", error);
    return NextResponse.json(
      { error: "Failed to export project" },
      { status: 500 }
    );
  }
}
