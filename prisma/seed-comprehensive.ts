import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seed...");

  // Create permissions first
  const permissions = await Promise.all([
    // Project permissions
    prisma.permission.upsert({
      where: { key: "CREATE_PROJECT" },
      update: {},
      create: {
        key: "CREATE_PROJECT",
        name: "Create Projects",
        description: "Create new projects",
        category: "PROJECT",
      },
    }),
    prisma.permission.upsert({
      where: { key: "VIEW_PROJECT" },
      update: {},
      create: {
        key: "VIEW_PROJECT",
        name: "View Projects",
        description: "View project details",
        category: "PROJECT",
      },
    }),
    prisma.permission.upsert({
      where: { key: "EDIT_PROJECT" },
      update: {},
      create: {
        key: "EDIT_PROJECT",
        name: "Edit Projects",
        description: "Edit project information",
        category: "PROJECT",
      },
    }),
    prisma.permission.upsert({
      where: { key: "DELETE_PROJECT" },
      update: {},
      create: {
        key: "DELETE_PROJECT",
        name: "Delete Projects",
        description: "Delete projects",
        category: "PROJECT",
      },
    }),
    prisma.permission.upsert({
      where: { key: "MANAGE_PROJECT_MEMBERS" },
      update: {},
      create: {
        key: "MANAGE_PROJECT_MEMBERS",
        name: "Manage Project Members",
        description: "Add/remove project team members",
        category: "PROJECT",
      },
    }),
    // Gate review permissions
    prisma.permission.upsert({
      where: { key: "CONDUCT_GATE_REVIEW" },
      update: {},
      create: {
        key: "CONDUCT_GATE_REVIEW",
        name: "Conduct Gate Reviews",
        description: "Perform gate reviews",
        category: "GATE_REVIEW",
      },
    }),
    prisma.permission.upsert({
      where: { key: "VIEW_GATE_REVIEWS" },
      update: {},
      create: {
        key: "VIEW_GATE_REVIEWS",
        name: "View Gate Reviews",
        description: "View gate review results",
        category: "GATE_REVIEW",
      },
    }),
    prisma.permission.upsert({
      where: { key: "APPROVE_GATE" },
      update: {},
      create: {
        key: "APPROVE_GATE",
        name: "Approve Gates",
        description: "Make gate approval decisions",
        category: "GATE_REVIEW",
      },
    }),
    // Document permissions
    prisma.permission.upsert({
      where: { key: "UPLOAD_DOCUMENT" },
      update: {},
      create: {
        key: "UPLOAD_DOCUMENT",
        name: "Upload Documents",
        description: "Upload project documents",
        category: "DOCUMENT",
      },
    }),
    prisma.permission.upsert({
      where: { key: "VIEW_DOCUMENTS" },
      update: {},
      create: {
        key: "VIEW_DOCUMENTS",
        name: "View Documents",
        description: "View project documents",
        category: "DOCUMENT",
      },
    }),
    prisma.permission.upsert({
      where: { key: "APPROVE_DOCUMENT" },
      update: {},
      create: {
        key: "APPROVE_DOCUMENT",
        name: "Approve Documents",
        description: "Approve uploaded documents",
        category: "DOCUMENT",
      },
    }),
    // Red flag permissions
    prisma.permission.upsert({
      where: { key: "RAISE_RED_FLAG" },
      update: {},
      create: {
        key: "RAISE_RED_FLAG",
        name: "Raise Red Flags",
        description: "Create risk alerts",
        category: "RED_FLAG",
      },
    }),
    prisma.permission.upsert({
      where: { key: "RESOLVE_RED_FLAG" },
      update: {},
      create: {
        key: "RESOLVE_RED_FLAG",
        name: "Resolve Red Flags",
        description: "Mark red flags as resolved",
        category: "RED_FLAG",
      },
    }),
    // System permissions
    prisma.permission.upsert({
      where: { key: "MANAGE_USERS" },
      update: {},
      create: {
        key: "MANAGE_USERS",
        name: "Manage Users",
        description: "Create, edit, and delete users",
        category: "USER",
      },
    }),
    prisma.permission.upsert({
      where: { key: "MANAGE_CUSTOM_ROLES" },
      update: {},
      create: {
        key: "MANAGE_CUSTOM_ROLES",
        name: "Manage Custom Roles",
        description: "Create and manage custom roles",
        category: "USER",
      },
    }),
    prisma.permission.upsert({
      where: { key: "MANAGE_CLUSTERS" },
      update: {},
      create: {
        key: "MANAGE_CLUSTERS",
        name: "Manage Clusters",
        description: "Manage project clusters",
        category: "SYSTEM",
      },
    }),
    prisma.permission.upsert({
      where: { key: "VIEW_ANALYTICS" },
      update: {},
      create: {
        key: "VIEW_ANALYTICS",
        name: "View Analytics",
        description: "View system analytics",
        category: "SYSTEM",
      },
    }),
    prisma.permission.upsert({
      where: { key: "EXPORT_DATA" },
      update: {},
      create: {
        key: "EXPORT_DATA",
        name: "Export Data",
        description: "Export system data",
        category: "SYSTEM",
      },
    }),
  ]);

  console.log("✅ Permissions created:", permissions.length);

  // Create custom roles
  const projectManagerRole = await prisma.customRole.upsert({
    where: { name: "Project Manager" },
    update: {},
    create: {
      name: "Project Manager",
      description: "Manages multiple projects and teams",
      color: "#8B5CF6",
      isActive: true,
    },
  });

  const seniorResearcherRole = await prisma.customRole.upsert({
    where: { name: "Senior Researcher" },
    update: {},
    create: {
      name: "Senior Researcher",
      description: "Senior research scientist with project oversight",
      color: "#F59E0B",
      isActive: true,
    },
  });

  // Assign permissions to custom roles
  const projectManagerPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          "CREATE_PROJECT",
          "VIEW_PROJECT",
          "EDIT_PROJECT",
          "MANAGE_PROJECT_MEMBERS",
          "VIEW_GATE_REVIEWS",
          "UPLOAD_DOCUMENT",
          "VIEW_DOCUMENTS",
          "RAISE_RED_FLAG",
          "VIEW_ANALYTICS",
        ],
      },
    },
  });

  await Promise.all(
    projectManagerPermissions.map((permission: any) =>
      prisma.customRolePermission.upsert({
        where: {
          customRoleId_permissionId: {
            customRoleId: projectManagerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          customRoleId: projectManagerRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  console.log("✅ Custom roles and permissions created");

  // Create users with different roles
  const hashedPassword = await bcrypt.hash("password123", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@stagegate.com" },
      update: {},
      create: {
        email: "admin@stagegate.com",
        name: "System Administrator",
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(),
        department: "IT",
        position: "System Administrator",
        phone: "+1-555-0101",
      },
    }),
    prisma.user.upsert({
      where: { email: "gatekeeper@stagegate.com" },
      update: {},
      create: {
        email: "gatekeeper@stagegate.com",
        name: "Dr. Sarah Johnson",
        password: hashedPassword,
        role: "GATEKEEPER",
        emailVerified: new Date(),
        department: "Research Oversight",
        position: "Senior Gatekeeper",
        phone: "+1-555-0102",
      },
    }),
    prisma.user.upsert({
      where: { email: "lead1@stagegate.com" },
      update: {},
      create: {
        email: "lead1@stagegate.com",
        name: "Michael Chen",
        password: hashedPassword,
        role: "PROJECT_LEAD",
        emailVerified: new Date(),
        department: "Digital Innovation",
        position: "Senior Project Lead",
        phone: "+1-555-0103",
      },
    }),
    prisma.user.upsert({
      where: { email: "lead2@stagegate.com" },
      update: {},
      create: {
        email: "lead2@stagegate.com",
        name: "Dr. Emily Rodriguez",
        password: hashedPassword,
        role: "PROJECT_LEAD",
        emailVerified: new Date(),
        department: "Healthcare Research",
        position: "Research Director",
        phone: "+1-555-0104",
      },
    }),
    prisma.user.upsert({
      where: { email: "researcher1@stagegate.com" },
      update: {},
      create: {
        email: "researcher1@stagegate.com",
        name: "David Kim",
        password: hashedPassword,
        role: "RESEARCHER",
        emailVerified: new Date(),
        department: "AI Research",
        position: "Senior Researcher",
        phone: "+1-555-0105",
      },
    }),
    prisma.user.upsert({
      where: { email: "researcher2@stagegate.com" },
      update: {},
      create: {
        email: "researcher2@stagegate.com",
        name: "Lisa Thompson",
        password: hashedPassword,
        role: "RESEARCHER",
        emailVerified: new Date(),
        department: "Sustainability",
        position: "Environmental Scientist",
        phone: "+1-555-0106",
      },
    }),
    prisma.user.upsert({
      where: { email: "reviewer1@stagegate.com" },
      update: {},
      create: {
        email: "reviewer1@stagegate.com",
        name: "Prof. James Wilson",
        password: hashedPassword,
        role: "REVIEWER",
        emailVerified: new Date(),
        department: "External Review",
        position: "Independent Reviewer",
        phone: "+1-555-0107",
      },
    }),
    prisma.user.upsert({
      where: { email: "manager1@stagegate.com" },
      update: {},
      create: {
        email: "manager1@stagegate.com",
        name: "Anna Martinez",
        password: hashedPassword,
        role: "CUSTOM",
        customRoleId: projectManagerRole.id,
        emailVerified: new Date(),
        department: "Project Management",
        position: "Senior Project Manager",
        phone: "+1-555-0108",
      },
    }),
  ]);

  console.log("✅ Users created:", users.length);

  // Create clusters
  const clusters = await Promise.all([
    prisma.cluster.upsert({
      where: { name: "Digital Innovation" },
      update: {},
      create: {
        name: "Digital Innovation",
        description: "Digital transformation and AI innovation projects",
        color: "#3B82F6",
      },
    }),
    prisma.cluster.upsert({
      where: { name: "Sustainability" },
      update: {},
      create: {
        name: "Sustainability",
        description: "Environmental and sustainability initiatives",
        color: "#10B981",
      },
    }),
    prisma.cluster.upsert({
      where: { name: "Healthcare" },
      update: {},
      create: {
        name: "Healthcare",
        description: "Healthcare and medical research projects",
        color: "#EF4444",
      },
    }),
    prisma.cluster.upsert({
      where: { name: "Energy" },
      update: {},
      create: {
        name: "Energy",
        description: "Renewable energy and efficiency projects",
        color: "#F59E0B",
      },
    }),
  ]);

  console.log("✅ Clusters created:", clusters.length);

  // Create projects with realistic data
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        projectId: "STP-0001",
        name: "AI-Powered Customer Analytics Platform",
        description:
          "Development of an advanced AI platform for real-time customer behavior analysis and predictive insights.",
        businessCase:
          "Market research indicates a $2.5B opportunity in AI-driven customer analytics. This platform will enable businesses to increase customer retention by 25% and improve conversion rates by 15%.",
        currentStage: "STAGE_1",
        status: "ACTIVE",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2025-06-30"),
        budget: 2500000,
        budgetUtilization: 0.35,
        duration: 18,
        technologyReadiness: "TRL 4",
        ipPotential: "High - 3 patent applications planned",
        clusterId: clusters[0].id,
        leadId: users[2].id, // Michael Chen
      },
    }),
    prisma.project.create({
      data: {
        projectId: "STP-0002",
        name: "Smart Grid Optimization System",
        description:
          "IoT-based smart grid system for optimizing energy distribution and reducing waste.",
        businessCase:
          "Energy waste costs utilities $50B annually. Our system can reduce waste by 20% and improve grid reliability by 30%.",
        currentStage: "STAGE_2",
        status: "ACTIVE",
        startDate: new Date("2023-09-01"),
        endDate: new Date("2025-03-31"),
        budget: 1800000,
        budgetUtilization: 0.65,
        duration: 19,
        technologyReadiness: "TRL 6",
        ipPotential: "Medium - 2 patent applications filed",
        clusterId: clusters[3].id,
        leadId: users[3].id, // Dr. Emily Rodriguez
      },
    }),
    prisma.project.create({
      data: {
        projectId: "STP-0003",
        name: "Biodegradable Packaging Innovation",
        description:
          "Development of fully biodegradable packaging materials from agricultural waste.",
        businessCase:
          "Plastic packaging market is $350B with growing demand for sustainable alternatives. Our solution offers 40% cost reduction vs current biodegradable options.",
        currentStage: "STAGE_0",
        status: "PENDING_REVIEW",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2025-12-31"),
        budget: 950000,
        budgetUtilization: 0.15,
        duration: 22,
        technologyReadiness: "TRL 3",
        ipPotential: "High - Novel polymer chemistry",
        clusterId: clusters[1].id,
        leadId: users[4].id, // David Kim
      },
    }),
    prisma.project.create({
      data: {
        projectId: "STP-0004",
        name: "Telemedicine Platform for Rural Areas",
        description:
          "Comprehensive telemedicine platform designed for low-bandwidth rural environments.",
        businessCase:
          "Rural healthcare access affects 60M Americans. Platform can reduce healthcare costs by 30% while improving access to specialists.",
        currentStage: "STAGE_3",
        status: "ACTIVE",
        startDate: new Date("2023-02-15"),
        endDate: new Date("2024-12-31"),
        budget: 1200000,
        budgetUtilization: 0.85,
        duration: 22,
        technologyReadiness: "TRL 8",
        ipPotential: "Medium - Software patents pending",
        clusterId: clusters[2].id,
        leadId: users[3].id, // Dr. Emily Rodriguez
      },
    }),
    prisma.project.create({
      data: {
        projectId: "STP-0005",
        name: "Quantum Computing Simulator",
        description:
          "High-performance quantum computing simulator for algorithm development and testing.",
        businessCase:
          "Quantum computing market expected to reach $65B by 2030. Simulator enables early algorithm development and testing.",
        currentStage: "STAGE_1",
        status: "RED_FLAG",
        startDate: new Date("2024-02-01"),
        endDate: new Date("2025-08-31"),
        budget: 3200000,
        budgetUtilization: 0.25,
        duration: 18,
        technologyReadiness: "TRL 4",
        ipPotential: "Very High - Breakthrough algorithms",
        clusterId: clusters[0].id,
        leadId: users[2].id, // Michael Chen
      },
    }),
  ]);

  console.log("✅ Projects created:", projects.length);

  // Add project members
  const projectMembers = await Promise.all([
    // AI Platform project members
    prisma.projectMember.create({
      data: {
        projectId: projects[0].id,
        userId: users[4].id, // David Kim
        role: "AI Research Lead",
      },
    }),
    prisma.projectMember.create({
      data: {
        projectId: projects[0].id,
        userId: users[5].id, // Lisa Thompson
        role: "Data Scientist",
      },
    }),
    // Smart Grid project members
    prisma.projectMember.create({
      data: {
        projectId: projects[1].id,
        userId: users[4].id, // David Kim
        role: "IoT Systems Engineer",
      },
    }),
    // Biodegradable Packaging members
    prisma.projectMember.create({
      data: {
        projectId: projects[2].id,
        userId: users[5].id, // Lisa Thompson
        role: "Materials Scientist",
      },
    }),
    // Telemedicine members
    prisma.projectMember.create({
      data: {
        projectId: projects[3].id,
        userId: users[4].id, // David Kim
        role: "Software Architect",
      },
    }),
  ]);

  console.log("✅ Project members added:", projectMembers.length);

  // Create gate reviews
  const gateReviews = await Promise.all([
    prisma.gateReview.create({
      data: {
        projectId: projects[0].id,
        stage: "STAGE_0",
        reviewerId: users[1].id, // Dr. Sarah Johnson
        decision: "GO",
        score: 8.5,
        comments:
          "Strong business case and technical approach. Recommend proceeding to Stage 1.",
        reviewDate: new Date("2024-01-10"),
        isCompleted: true,
      },
    }),
    prisma.gateReview.create({
      data: {
        projectId: projects[1].id,
        stage: "STAGE_1",
        reviewerId: users[6].id, // Prof. James Wilson
        decision: "GO",
        score: 7.8,
        comments:
          "Good progress on technical milestones. Some budget concerns addressed.",
        reviewDate: new Date("2024-02-15"),
        isCompleted: true,
      },
    }),
    prisma.gateReview.create({
      data: {
        projectId: projects[3].id,
        stage: "STAGE_2",
        reviewerId: users[1].id, // Dr. Sarah Johnson
        decision: "GO",
        score: 9.2,
        comments:
          "Excellent clinical trial results. Ready for pilot deployment.",
        reviewDate: new Date("2024-08-20"),
        isCompleted: true,
      },
    }),
    prisma.gateReview.create({
      data: {
        projectId: projects[4].id,
        stage: "STAGE_0",
        reviewerId: users[6].id, // Prof. James Wilson
        decision: "HOLD",
        score: 6.2,
        comments:
          "Technical risks need further mitigation. Recommend additional research phase.",
        reviewDate: new Date("2024-03-10"),
        isCompleted: true,
      },
    }),
  ]);

  console.log("✅ Gate reviews created:", gateReviews.length);

  // Create red flags
  const redFlags = await Promise.all([
    prisma.redFlag.create({
      data: {
        projectId: projects[4].id, // Quantum Computing project
        raisedById: users[4].id, // David Kim
        title: "Technical Feasibility Concerns",
        description:
          "Recent research indicates that the proposed quantum algorithm may not be implementable with current hardware limitations. Need to reassess technical approach.",
        severity: "HIGH",
        status: "OPEN",
      },
    }),
    prisma.redFlag.create({
      data: {
        projectId: projects[0].id, // AI Platform
        raisedById: users[5].id, // Lisa Thompson
        title: "Data Privacy Compliance",
        description:
          "New GDPR requirements may impact our data collection and processing approach. Legal review needed.",
        severity: "MEDIUM",
        status: "IN_PROGRESS",
      },
    }),
    prisma.redFlag.create({
      data: {
        projectId: projects[1].id, // Smart Grid
        raisedById: users[3].id, // Dr. Emily Rodriguez
        title: "Supplier Delivery Delays",
        description:
          "Key IoT sensor supplier experiencing 3-month delays due to chip shortage. May impact project timeline.",
        severity: "MEDIUM",
        status: "RESOLVED",
        resolvedAt: new Date("2024-10-15"),
        resolvedBy: users[2].id, // Michael Chen
      },
    }),
  ]);

  console.log("✅ Red flags created:", redFlags.length);

  // Create milestones
  const milestones = await Promise.all([
    prisma.milestone.create({
      data: {
        projectId: projects[0].id,
        title: "AI Model Training Complete",
        description: "Complete training of core AI models with initial dataset",
        dueDate: new Date("2024-06-30"),
        completedAt: new Date("2024-06-28"),
        isCompleted: true,
        progress: 100,
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projects[0].id,
        title: "Beta Platform Release",
        description:
          "Release beta version of analytics platform for internal testing",
        dueDate: new Date("2024-12-15"),
        isCompleted: false,
        progress: 75,
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projects[1].id,
        title: "IoT Sensor Network Deployment",
        description: "Deploy and test IoT sensor network in pilot grid section",
        dueDate: new Date("2024-11-30"),
        isCompleted: false,
        progress: 60,
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: projects[3].id,
        title: "Clinical Trial Completion",
        description: "Complete Phase II clinical trials with partner hospitals",
        dueDate: new Date("2024-08-31"),
        completedAt: new Date("2024-08-25"),
        isCompleted: true,
        progress: 100,
      },
    }),
  ]);

  console.log("✅ Milestones created:", milestones.length);

  // Create documents
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        projectId: projects[0].id,
        uploaderId: users[2].id,
        name: "AI Platform Business Case",
        description: "Comprehensive business case and market analysis",
        type: "BUSINESS_CASE",
        fileUrl: "/documents/ai-platform-business-case.pdf",
        fileName: "ai-platform-business-case.pdf",
        fileSize: 2048576,
        mimeType: "application/pdf",
        isRequired: true,
        isApproved: true,
        approvedBy: users[1].id,
        approvedAt: new Date("2024-01-12"),
        version: "1.2",
      },
    }),
    prisma.document.create({
      data: {
        projectId: projects[0].id,
        uploaderId: users[4].id,
        name: "Technical Architecture Document",
        description: "Detailed technical architecture and implementation plan",
        type: "TECHNICAL_SPEC",
        fileUrl: "/documents/ai-platform-tech-spec.pdf",
        fileName: "ai-platform-tech-spec.pdf",
        fileSize: 3145728,
        mimeType: "application/pdf",
        isRequired: true,
        isApproved: false,
        version: "2.0",
      },
    }),
    prisma.document.create({
      data: {
        projectId: projects[1].id,
        uploaderId: users[3].id,
        name: "Smart Grid Risk Assessment",
        description: "Comprehensive risk analysis and mitigation strategies",
        type: "RISK_ASSESSMENT",
        fileUrl: "/documents/smart-grid-risk-assessment.pdf",
        fileName: "smart-grid-risk-assessment.pdf",
        fileSize: 1572864,
        mimeType: "application/pdf",
        isRequired: true,
        isApproved: true,
        approvedBy: users[1].id,
        approvedAt: new Date("2024-02-20"),
        version: "1.0",
      },
    }),
  ]);

  console.log("✅ Documents created:", documents.length);

  // Create templates
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        name: "Business Case Template",
        description: "Standard template for project business cases",
        type: "BUSINESS_CASE",
        stage: "STAGE_0",
        fileUrl: "/templates/business-case-template.docx",
        fileName: "business-case-template.docx",
        isActive: true,
      },
    }),
    prisma.template.create({
      data: {
        name: "Technical Specification Template",
        description:
          "Template for technical specifications and architecture documents",
        type: "TECHNICAL_SPEC",
        stage: "STAGE_1",
        fileUrl: "/templates/tech-spec-template.docx",
        fileName: "tech-spec-template.docx",
        isActive: true,
      },
    }),
    prisma.template.create({
      data: {
        name: "Risk Assessment Template",
        description: "Comprehensive risk assessment template",
        type: "RISK_ASSESSMENT",
        fileUrl: "/templates/risk-assessment-template.xlsx",
        fileName: "risk-assessment-template.xlsx",
        isActive: true,
      },
    }),
    prisma.template.create({
      data: {
        name: "Budget Planning Template",
        description: "Financial planning and budget tracking template",
        type: "BUDGET_PLAN",
        fileUrl: "/templates/budget-template.xlsx",
        fileName: "budget-template.xlsx",
        isActive: true,
      },
    }),
  ]);

  console.log("✅ Templates created:", templates.length);

  // Create comments
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content:
          "Great progress on the AI model training. The accuracy metrics are exceeding our initial targets.",
        authorId: users[1].id, // Dr. Sarah Johnson
        projectId: projects[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content:
          "We should consider the ethical implications of the AI decision-making process. I recommend adding an ethics review milestone.",
        authorId: users[6].id, // Prof. James Wilson
        projectId: projects[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content:
          "The IoT sensor deployment is ahead of schedule. Excellent work by the engineering team.",
        authorId: users[3].id, // Dr. Emily Rodriguez
        projectId: projects[1].id,
      },
    }),
  ]);

  console.log("✅ Comments created:", comments.length);

  // Create notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[2].id, // Michael Chen
        type: "GATE_REVIEW",
        title: "Gate Review Completed",
        message:
          "Your project 'AI-Powered Customer Analytics Platform' has passed Stage 0 gate review.",
        isRead: false,
        data: { projectId: projects[0].id, stage: "STAGE_0" },
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[4].id, // David Kim
        type: "RED_FLAG",
        title: "Red Flag Raised",
        message:
          "A high-severity red flag has been raised for the Quantum Computing Simulator project.",
        isRead: false,
        data: { projectId: projects[4].id, severity: "HIGH" },
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[3].id, // Dr. Emily Rodriguez
        type: "DOCUMENT_UPLOAD",
        title: "Document Approval Required",
        message: "Technical Architecture Document requires your approval.",
        isRead: true,
        data: { documentId: documents[1].id },
      },
    }),
  ]);

  console.log("✅ Notifications created:", notifications.length);

  // Create activity logs
  const activityLogs = await Promise.all([
    prisma.activityLog.create({
      data: {
        userId: users[2].id,
        projectId: projects[0].id,
        action: "PROJECT_CREATED",
        details: "Created new project: AI-Powered Customer Analytics Platform",
        metadata: { stage: "STAGE_0", budget: 2500000 },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: users[1].id,
        projectId: projects[0].id,
        action: "GATE_REVIEWED",
        details: "Completed Stage 0 gate review with GO decision",
        metadata: { stage: "STAGE_0", decision: "GO", score: 8.5 },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: users[4].id,
        projectId: projects[4].id,
        action: "RED_FLAG_RAISED",
        details: "Raised red flag: Technical Feasibility Concerns",
        metadata: { severity: "HIGH", flagId: redFlags[0].id },
      },
    }),
  ]);

  console.log("✅ Activity logs created:", activityLogs.length);

  // Create system settings
  const settings = await Promise.all([
    prisma.settings.create({
      data: {
        key: "SYSTEM_NAME",
        value: "Stage-Gate Innovation Platform",
        type: "STRING",
      },
    }),
    prisma.settings.create({
      data: {
        key: "MAX_FILE_SIZE",
        value: "10485760", // 10MB
        type: "NUMBER",
      },
    }),
    prisma.settings.create({
      data: {
        key: "EMAIL_NOTIFICATIONS",
        value: "true",
        type: "BOOLEAN",
      },
    }),
    prisma.settings.create({
      data: {
        key: "AUTO_BACKUP",
        value: "true",
        type: "BOOLEAN",
      },
    }),
  ]);

  console.log("✅ System settings created:", settings.length);

  console.log("🎉 Comprehensive database seeded successfully!");
  console.log("📊 Summary:");
  console.log(`   - ${permissions.length} permissions`);
  console.log(`   - 2 custom roles`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${clusters.length} clusters`);
  console.log(`   - ${projects.length} projects`);
  console.log(`   - ${projectMembers.length} project members`);
  console.log(`   - ${gateReviews.length} gate reviews`);
  console.log(`   - ${redFlags.length} red flags`);
  console.log(`   - ${milestones.length} milestones`);
  console.log(`   - ${documents.length} documents`);
  console.log(`   - ${templates.length} templates`);
  console.log(`   - ${comments.length} comments`);
  console.log(`   - ${notifications.length} notifications`);
  console.log(`   - ${activityLogs.length} activity logs`);
  console.log(`   - ${settings.length} system settings`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
