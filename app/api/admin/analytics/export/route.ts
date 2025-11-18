import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
    });

    if (!user || !["ADMIN", "GATEKEEPER"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { format: exportFormat, analytics, timeRange } = body;

    // Validate analytics data
    if (!analytics) {
      return NextResponse.json(
        { error: "No analytics data provided" },
        { status: 400 }
      );
    }

    switch (exportFormat) {
      case "pdf":
        return await generateAnalyticsPDF(analytics, timeRange, user);
      case "pptx":
        return await generateAnalyticsPowerPoint(analytics, timeRange, user);
      case "csv":
        return await generateAnalyticsCSV(analytics, timeRange, user);
      case "json":
        return await generateAnalyticsJSON(analytics, timeRange, user);
      default:
        return NextResponse.json(
          { error: "Invalid format. Supported formats: pdf, pptx, csv, json" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json(
      {
        error: "Failed to export analytics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Alternative PDF generation using jsPDF
async function generatePDFWithJsPDF(
  analytics: any,
  timeRange: number,
  user: any
) {
  try {
    const jsPDF = require("jspdf");

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text("Analytics Dashboard Report", 20, 30);

    // Add metadata
    doc.setFontSize(12);
    doc.text(`Generated: ${format(new Date(), "PPP 'at' p")}`, 20, 45);
    doc.text(`Report Period: Last ${timeRange} days`, 20, 55);
    doc.text(`Exported by: ${user.name} (${user.email})`, 20, 65);

    // Add executive summary
    doc.setFontSize(16);
    doc.text("Executive Summary", 20, 85);

    doc.setFontSize(12);
    let yPos = 100;
    doc.text(
      `Total Projects: ${analytics.overview?.totalProjects || 0}`,
      20,
      yPos
    );
    yPos += 10;
    doc.text(`Total Users: ${analytics.overview?.totalUsers || 0}`, 20, yPos);
    yPos += 10;
    doc.text(
      `Completion Rate: ${analytics.overview?.completionRate || 0}%`,
      20,
      yPos
    );
    yPos += 10;

    if (analytics.overview?.totalBudget) {
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency: "ZAR",
          minimumFractionDigits: 0,
        }).format(amount);
      };
      doc.text(
        `Total Budget: ${formatCurrency(analytics.overview.totalBudget)}`,
        20,
        yPos
      );
      yPos += 20;
    }

    // Add system health
    doc.setFontSize(16);
    doc.text("System Health", 20, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.text(
      `Active Projects: ${analytics.systemHealth?.activeProjects || 0}`,
      20,
      yPos
    );
    yPos += 10;
    doc.text(
      `Pending Reviews: ${analytics.systemHealth?.pendingReviews || 0}`,
      20,
      yPos
    );
    yPos += 10;
    doc.text(`Red Flags: ${analytics.systemHealth?.redFlags || 0}`, 20, yPos);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="analytics-report-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("jsPDF generation failed:", error);
    throw error;
  }
}

async function generateAnalyticsPDF(
  analytics: any,
  timeRange: number,
  user: any
) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-ZA").format(num);
  };

  // Create comprehensive HTML content for PDF generation
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Analytics Dashboard Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background: #fff;
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
            font-weight: 600;
        }
        .header .subtitle {
            color: #666;
            margin: 10px 0;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 8px;
            margin-bottom: 20px;
            font-size: 20px;
            font-weight: 600;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .chart-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .data-table th,
        .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .data-table th {
            background: #007bff;
            color: white;
            font-weight: 600;
        }
        .data-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-active { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-completed { background: #d1ecf1; color: #0c5460; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
            .header { page-break-after: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Analytics Dashboard Report</h1>
        <div class="subtitle">
            <strong>Report Period:</strong> Last ${timeRange} days<br>
            <strong>Generated:</strong> ${format(new Date(), "PPP 'at' p")}<br>
            <strong>Exported by:</strong> ${user.name} (${user.email})
        </div>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${formatNumber(analytics.overview?.totalProjects || 0)}</div>
                <div class="metric-label">Total Projects</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatNumber(analytics.overview?.totalUsers || 0)}</div>
                <div class="metric-label">Total Users</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analytics.overview?.completionRate || 0}%</div>
                <div class="metric-label">Completion Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analytics.overview?.totalBudget ? formatCurrency(analytics.overview.totalBudget) : "N/A"}</div>
                <div class="metric-label">Total Budget</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>System Health</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${formatNumber(analytics.systemHealth?.activeProjects || 0)}</div>
                <div class="metric-label">Active Projects</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatNumber(analytics.systemHealth?.pendingReviews || 0)}</div>
                <div class="metric-label">Pending Reviews</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatNumber(analytics.systemHealth?.redFlags || 0)}</div>
                <div class="metric-label">Red Flags</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatNumber(analytics.systemHealth?.overdueTasks || 0)}</div>
                <div class="metric-label">Overdue Tasks</div>
            </div>
        </div>
    </div>

    ${
      analytics.projectsByStatus
        ? `
    <div class="section">
        <h2>Project Status Breakdown</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(analytics.projectsByStatus)
                  .map(([status, count]) => {
                    const total = Object.values(
                      analytics.projectsByStatus
                    ).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                    const percentage =
                      total > 0
                        ? Math.round(((Number(count) || 0) / total) * 100)
                        : 0;
                    return `
                    <tr>
                        <td><span class="status-badge status-${status.toLowerCase()}">${status.replace(/_/g, " ")}</span></td>
                        <td>${formatNumber(count as number)}</td>
                        <td>${percentage}%</td>
                    </tr>
                  `;
                  })
                  .join("")}
            </tbody>
        </table>
    </div>
    `
        : ""
    }

    ${
      analytics.projectsByCluster
        ? `
    <div class="section">
        <h2>Projects by Cluster</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Cluster</th>
                    <th>Projects</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(analytics.projectsByCluster)
                  .map(([cluster, count]) => {
                    const total = Object.values(
                      analytics.projectsByCluster
                    ).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                    const percentage =
                      total > 0
                        ? Math.round(((Number(count) || 0) / total) * 100)
                        : 0;
                    return `
                    <tr>
                        <td>${cluster}</td>
                        <td>${formatNumber(count as number)}</td>
                        <td>${percentage}%</td>
                    </tr>
                  `;
                  })
                  .join("")}
            </tbody>
        </table>
    </div>
    `
        : ""
    }

    ${
      analytics.recentActivity && analytics.recentActivity.length > 0
        ? `
    <div class="section">
        <h2>Recent Activity</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Activity</th>
                    <th>User</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${analytics.recentActivity
                  .slice(0, 15)
                  .map(
                    (activity: any) => `
                    <tr>
                        <td>${activity.description || activity.action || activity.type || "Unknown activity"}</td>
                        <td>${activity.user?.name || activity.userName || "Unknown user"}</td>
                        <td>${activity.createdAt ? format(new Date(activity.createdAt), "MMM dd, yyyy HH:mm") : "Unknown date"}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    </div>
    `
        : ""
    }

    <div class="footer">
        <p><strong>Stage Gate Management System</strong> - Analytics Report</p>
        <p>Confidential - For internal use only</p>
        <p>Generated on ${format(new Date(), "EEEE, MMMM do, yyyy 'at' h:mm a")}</p>
    </div>
</body>
</html>`;

  try {
    // Try to use Puppeteer for PDF generation
    const puppeteer = require("puppeteer");

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

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

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

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="analytics-report-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
      },
    });
  } catch (error) {
    // Try alternative PDF generation with jsPDF
    try {
      return await generatePDFWithJsPDF(analytics, timeRange, user);
    } catch (jsPdfError) {
      // Final fallback to HTML format

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="analytics-report-${format(new Date(), "yyyy-MM-dd")}.html"`,
        },
      });
    }
  }
}
// Generate actual PowerPoint file using pptxgenjs
async function generateActualPowerPoint(
  analytics: any,
  timeRange: number,
  user: any
) {
  try {
    const PptxGenJS = require("pptxgenjs");

    const pptx = new PptxGenJS();

    // Slide 1: Title slide
    const slide1 = pptx.addSlide();
    slide1.addText("Analytics Dashboard Report", {
      x: 1,
      y: 1,
      w: 8,
      h: 1,
      fontSize: 32,
      bold: true,
      color: "0066CC",
    });
    slide1.addText(`Report Period: Last ${timeRange} days`, {
      x: 1,
      y: 2.5,
      w: 8,
      h: 0.5,
      fontSize: 16,
      color: "666666",
    });
    slide1.addText(`Generated: ${format(new Date(), "PPP 'at' p")}`, {
      x: 1,
      y: 3,
      w: 8,
      h: 0.5,
      fontSize: 14,
      color: "666666",
    });
    slide1.addText(`Exported by: ${user.name}`, {
      x: 1,
      y: 3.5,
      w: 8,
      h: 0.5,
      fontSize: 14,
      color: "666666",
    });

    // Slide 2: Executive Summary
    const slide2 = pptx.addSlide();
    slide2.addText("Executive Summary", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: "0066CC",
    });

    const summaryData = [
      ["Metric", "Value"],
      ["Total Projects", (analytics.overview?.totalProjects || 0).toString()],
      ["Total Users", (analytics.overview?.totalUsers || 0).toString()],
      ["Completion Rate", `${analytics.overview?.completionRate || 0}%`],
    ];

    if (analytics.overview?.totalBudget) {
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency: "ZAR",
          minimumFractionDigits: 0,
        }).format(amount);
      };
      summaryData.push([
        "Total Budget",
        formatCurrency(analytics.overview.totalBudget),
      ]);
    }

    slide2.addTable(summaryData, {
      x: 1,
      y: 1.5,
      w: 7,
      h: 3,
      fontSize: 14,
      border: { pt: 1, color: "CCCCCC" },
      fill: { color: "F8F9FA" },
    });

    // Slide 3: System Health
    const slide3 = pptx.addSlide();
    slide3.addText("System Health", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: "0066CC",
    });

    const healthData = [
      ["Metric", "Count"],
      [
        "Active Projects",
        (analytics.systemHealth?.activeProjects || 0).toString(),
      ],
      [
        "Pending Reviews",
        (analytics.systemHealth?.pendingReviews || 0).toString(),
      ],
      ["Red Flags", (analytics.systemHealth?.redFlags || 0).toString()],
      ["Overdue Tasks", (analytics.systemHealth?.overdueTasks || 0).toString()],
    ];

    slide3.addTable(healthData, {
      x: 1,
      y: 1.5,
      w: 7,
      h: 3,
      fontSize: 14,
      border: { pt: 1, color: "CCCCCC" },
      fill: { color: "F8F9FA" },
    });

    // Generate the PowerPoint file
    const pptxBuffer = await pptx.write({ outputType: "nodebuffer" });

    return new NextResponse(pptxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="analytics-presentation-${format(new Date(), "yyyy-MM-dd")}.pptx"`,
      },
    });
  } catch (error) {
    throw error;
  }
}

async function generateAnalyticsPowerPoint(
  analytics: any,
  timeRange: number,
  user: any
) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const presentation = {
    title: "Analytics Dashboard Report",
    subtitle: `Stage Gate Management System - ${format(new Date(), "MMMM yyyy")}`,
    reportPeriod: `Last ${timeRange} days`,
    generatedAt: format(new Date(), "PPP 'at' p"),
    exportedBy: `${user.name} (${user.email})`,
    slides: [
      {
        title: "Executive Summary",
        type: "overview",
        content: {
          totalProjects: analytics.overview?.totalProjects || 0,
          totalUsers: analytics.overview?.totalUsers || 0,
          completionRate: `${analytics.overview?.completionRate || 0}%`,
          totalBudget: analytics.overview?.totalBudget
            ? formatCurrency(analytics.overview.totalBudget)
            : "Not specified",
          reportPeriod: `Last ${timeRange} days`,
        },
      },
      {
        title: "System Health Overview",
        type: "metrics",
        content: {
          activeProjects: analytics.systemHealth?.activeProjects || 0,
          pendingReviews: analytics.systemHealth?.pendingReviews || 0,
          redFlags: analytics.systemHealth?.redFlags || 0,
          overdueTasks: analytics.systemHealth?.overdueTasks || 0,
        },
      },
      {
        title: "Project Status Distribution",
        type: "chart",
        content: {
          chartType: "pie",
          data: analytics.projectsByStatus
            ? Object.entries(analytics.projectsByStatus).map(
                ([status, count]) => ({
                  label: status.replace(/_/g, " "),
                  value: count,
                })
              )
            : [],
        },
      },
      {
        title: "Projects by Cluster",
        type: "chart",
        content: {
          chartType: "bar",
          data: analytics.projectsByCluster
            ? Object.entries(analytics.projectsByCluster).map(
                ([cluster, count]) => ({
                  label: cluster,
                  value: count,
                })
              )
            : [],
        },
      },
      {
        title: "User Activity Summary",
        type: "table",
        content: {
          headers: ["Role", "Count", "Percentage"],
          data: analytics.usersByRole
            ? Object.entries(analytics.usersByRole).map(([role, count]) => {
                const total = Object.values(analytics.usersByRole).reduce(
                  (a: number, b: any) => a + (Number(b) || 0),
                  0
                );
                const percentage =
                  total > 0
                    ? Math.round(((Number(count) || 0) / total) * 100)
                    : 0;
                return [role.replace(/_/g, " "), count, `${percentage}%`];
              })
            : [],
        },
      },
      {
        title: "Recent Activity Highlights",
        type: "list",
        content: {
          items: analytics.recentActivity
            ? analytics.recentActivity
                .slice(0, 10)
                .map((activity: any, index: number) => ({
                  index: index + 1,
                  description:
                    activity.description ||
                    activity.action ||
                    activity.type ||
                    "Unknown activity",
                  user:
                    activity.user?.name || activity.userName || "Unknown user",
                  date: activity.createdAt
                    ? format(new Date(activity.createdAt), "MMM dd, yyyy")
                    : "Unknown date",
                }))
            : [],
        },
      },
      {
        title: "Key Performance Indicators",
        type: "kpi",
        content: {
          kpis: [
            {
              label: "Project Completion Rate",
              value: `${analytics.overview?.completionRate || 0}%`,
              trend:
                analytics.overview?.completionRate > 75
                  ? "positive"
                  : analytics.overview?.completionRate > 50
                    ? "neutral"
                    : "negative",
            },
            {
              label: "Active Projects",
              value: analytics.systemHealth?.activeProjects || 0,
              trend: "neutral",
            },
            {
              label: "Pending Reviews",
              value: analytics.systemHealth?.pendingReviews || 0,
              trend:
                analytics.systemHealth?.pendingReviews > 10
                  ? "negative"
                  : "positive",
            },
            {
              label: "Red Flags",
              value: analytics.systemHealth?.redFlags || 0,
              trend:
                analytics.systemHealth?.redFlags > 5 ? "negative" : "positive",
            },
          ],
        },
      },
      {
        title: "Recommendations",
        type: "recommendations",
        content: {
          recommendations: [
            analytics.systemHealth?.redFlags > 5
              ? "Address high number of red flags to improve project health"
              : "Red flag management is under control",
            analytics.systemHealth?.pendingReviews > 10
              ? "Prioritize pending reviews to maintain project momentum"
              : "Review process is running smoothly",
            analytics.overview?.completionRate < 50
              ? "Focus on improving project completion rates"
              : "Project completion rate is satisfactory",
            "Continue monitoring system health metrics regularly",
            "Consider implementing automated alerts for critical thresholds",
          ],
        },
      },
    ],
    metadata: {
      totalSlides: 8,
      generatedAt: new Date().toISOString(),
      version: "1.0",
      format: "PowerPoint JSON",
    },
  };

  // Try to generate actual PowerPoint file first
  try {
    return await generateActualPowerPoint(analytics, timeRange, user);
  } catch (error) {
    // Fallback to JSON format
    return new NextResponse(JSON.stringify(presentation, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="analytics-presentation-${format(new Date(), "yyyy-MM-dd")}.json"`,
      },
    });
  }
}

async function generateAnalyticsCSV(
  analytics: any,
  timeRange: number,
  user: any
) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  let csvContent = "";

  // Header information
  csvContent += "ANALYTICS DASHBOARD REPORT\n";
  csvContent += `Generated,${format(new Date(), "PPP 'at' p")}\n`;
  csvContent += `Report Period,Last ${timeRange} days\n`;
  csvContent += `Exported by,${escapeCSV(user.name)} (${escapeCSV(user.email)})\n`;
  csvContent += "\n";

  // Executive Summary
  csvContent += "EXECUTIVE SUMMARY\n";
  csvContent += "Metric,Value\n";
  csvContent += `Total Projects,${analytics.overview?.totalProjects || 0}\n`;
  csvContent += `Total Users,${analytics.overview?.totalUsers || 0}\n`;
  csvContent += `Completion Rate,${analytics.overview?.completionRate || 0}%\n`;
  csvContent += `Total Budget,${analytics.overview?.totalBudget ? formatCurrency(analytics.overview.totalBudget) : "Not specified"}\n`;
  csvContent += "\n";

  // System Health
  csvContent += "SYSTEM HEALTH\n";
  csvContent += "Metric,Value\n";
  csvContent += `Active Projects,${analytics.systemHealth?.activeProjects || 0}\n`;
  csvContent += `Pending Reviews,${analytics.systemHealth?.pendingReviews || 0}\n`;
  csvContent += `Red Flags,${analytics.systemHealth?.redFlags || 0}\n`;
  csvContent += `Overdue Tasks,${analytics.systemHealth?.overdueTasks || 0}\n`;
  csvContent += "\n";

  // Project Status Breakdown
  if (analytics.projectsByStatus) {
    csvContent += "PROJECT STATUS BREAKDOWN\n";
    csvContent += "Status,Count,Percentage\n";
    const total = Object.values(analytics.projectsByStatus).reduce(
      (a: number, b: any) => a + (Number(b) || 0),
      0
    );
    Object.entries(analytics.projectsByStatus).forEach(([status, count]) => {
      const percentage =
        total > 0 ? Math.round(((Number(count) || 0) / total) * 100) : 0;
      csvContent += `${escapeCSV(status.replace(/_/g, " "))},${count},${percentage}%\n`;
    });
    csvContent += "\n";
  }

  // Projects by Cluster
  if (analytics.projectsByCluster) {
    csvContent += "PROJECTS BY CLUSTER\n";
    csvContent += "Cluster,Count,Percentage\n";
    const total = Object.values(analytics.projectsByCluster).reduce(
      (a: number, b: any) => a + (Number(b) || 0),
      0
    );
    Object.entries(analytics.projectsByCluster).forEach(([cluster, count]) => {
      const percentage =
        total > 0 ? Math.round(((Number(count) || 0) / total) * 100) : 0;
      csvContent += `${escapeCSV(cluster)},${count},${percentage}%\n`;
    });
    csvContent += "\n";
  }

  // Users by Role
  if (analytics.usersByRole) {
    csvContent += "USERS BY ROLE\n";
    csvContent += "Role,Count,Percentage\n";
    const total = Object.values(analytics.usersByRole).reduce(
      (a: number, b: any) => a + (Number(b) || 0),
      0
    );
    Object.entries(analytics.usersByRole).forEach(([role, count]) => {
      const percentage =
        total > 0 ? Math.round(((Number(count) || 0) / total) * 100) : 0;
      csvContent += `${escapeCSV(role.replace(/_/g, " "))},${count},${percentage}%\n`;
    });
    csvContent += "\n";
  }

  // Recent Activity
  if (analytics.recentActivity && analytics.recentActivity.length > 0) {
    csvContent += "RECENT ACTIVITY\n";
    csvContent += "Activity,User,Date,Details\n";
    analytics.recentActivity.slice(0, 50).forEach((activity: any) => {
      csvContent += `${escapeCSV(activity.description || activity.action || activity.type || "Unknown activity")},`;
      csvContent += `${escapeCSV(activity.user?.name || activity.userName || "Unknown user")},`;
      csvContent += `${escapeCSV(activity.createdAt ? format(new Date(activity.createdAt), "MMM dd, yyyy HH:mm") : "Unknown date")},`;
      csvContent += `${escapeCSV(activity.details || "No details")}\n`;
    });
    csvContent += "\n";
  }

  // Footer
  csvContent += "REPORT METADATA\n";
  csvContent += "Field,Value\n";
  csvContent += `Report Type,Analytics Dashboard Export\n`;
  csvContent += `Export Format,CSV\n`;
  csvContent += `Generated At,${format(new Date(), "PPP 'at' p")}\n`;
  csvContent += `System,Stage Gate Management System\n`;
  csvContent += `Confidentiality,Internal Use Only\n`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="analytics-report-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}

async function generateAnalyticsJSON(
  analytics: any,
  timeRange: number,
  user: any
) {
  const exportData = {
    metadata: {
      title: "Analytics Dashboard Report",
      reportPeriod: `Last ${timeRange} days`,
      generatedAt: new Date().toISOString(),
      exportedBy: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      system: "Stage Gate Management System",
      version: "1.0",
      confidentiality: "Internal Use Only",
    },
    summary: {
      totalProjects: analytics.overview?.totalProjects || 0,
      totalUsers: analytics.overview?.totalUsers || 0,
      completionRate: analytics.overview?.completionRate || 0,
      totalBudget: analytics.overview?.totalBudget || 0,
    },
    systemHealth: {
      activeProjects: analytics.systemHealth?.activeProjects || 0,
      pendingReviews: analytics.systemHealth?.pendingReviews || 0,
      redFlags: analytics.systemHealth?.redFlags || 0,
      overdueTasks: analytics.systemHealth?.overdueTasks || 0,
    },
    breakdowns: {
      projectsByStatus: analytics.projectsByStatus || {},
      projectsByCluster: analytics.projectsByCluster || {},
      projectsByStage: analytics.projectsByStage || {},
      usersByRole: analytics.usersByRole || {},
      usersByDepartment: analytics.usersByDepartment || {},
    },
    activity: {
      recent: analytics.recentActivity || [],
      byType: analytics.activitiesByType || {},
      summary: {
        totalActivities: analytics.recentActivity?.length || 0,
        uniqueUsers: analytics.recentActivity
          ? [
              ...new Set(
                analytics.recentActivity.map((a: any) => a.user?.id || a.userId)
              ),
            ].length
          : 0,
      },
    },
    reviews: {
      stats: analytics.gateReviewStats || {},
      byDecision: analytics.reviewsByDecision || {},
    },
    trends: analytics.trends || {},
    rawData: analytics,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="analytics-report-${format(new Date(), "yyyy-MM-dd")}.json"`,
    },
  });
}
