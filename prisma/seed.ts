import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create clusters
  const smartPlacesCluster = await prisma.cluster.upsert({
    where: { name: "Smart Places" },
    update: {},
    create: {
      name: "Smart Places",
      description: "Smart city and urban technology solutions",
      color: "#3B82F6",
    },
  });

  await prisma.cluster.upsert({
    where: { name: "Health" },
    update: {},
    create: {
      name: "Health",
      description: "Healthcare and medical technology research",
      color: "#10B981",
    },
  });

  await prisma.cluster.upsert({
    where: { name: "Energy" },
    update: {},
    create: {
      name: "Energy",
      description: "Renewable energy and sustainability solutions",
      color: "#F59E0B",
    },
  });

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@csir.co.za" },
    update: {},
    create: {
      name: "Dr. John Smith",
      email: "admin@csir.co.za",
      password: hashedPassword,
      role: "ADMIN",
      department: "Smart Places",
      position: "Gatekeeper - Smart Places",
      emailVerified: new Date(),
    },
  });

  const projectLead1 = await prisma.user.upsert({
    where: { email: "sarah.johnson@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@csir.co.za",
      password: hashedPassword,
      role: "PROJECT_LEAD",
      department: "Smart Places",
      position: "Lead Researcher",
      emailVerified: new Date(),
    },
  });

  const projectLead2 = await prisma.user.upsert({
    where: { email: "mike.brown@csir.co.za" },
    update: {},
    create: {
      name: "Prof. Mike Brown",
      email: "mike.brown@csir.co.za",
      password: hashedPassword,
      role: "PROJECT_LEAD",
      department: "Smart Places",
      position: "Lead Developer",
      emailVerified: new Date(),
    },
  });

  const researcher1 = await prisma.user.upsert({
    where: { email: "linda.williams@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Linda Williams",
      email: "linda.williams@csir.co.za",
      password: hashedPassword,
      role: "RESEARCHER",
      department: "Smart Places",
      position: "Senior Researcher",
      emailVerified: new Date(),
    },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      projectId: "STP-5678",
      name: "Smart Water Meter",
      description: "IoT-based water monitoring system for urban areas",
      businessCase:
        "The system aims to reduce water loss by 30% through early leak detection and promote water conservation by making consumption data accessible to users in real-time.",
      currentStage: "STAGE_1",
      status: "ACTIVE",
      startDate: new Date("2023-01-15"),
      budget: 1200000,
      budgetUtilization: 45,
      technologyReadiness: "TRL-4",
      ipPotential: "High",
      duration: 18,
      clusterId: smartPlacesCluster.id,
      leadId: projectLead1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      projectId: "STP-3456",
      name: "Urban Traffic AI",
      description: "AI-powered traffic flow optimization system",
      businessCase:
        "Reduce urban traffic congestion by 25% through intelligent traffic management and predictive analytics.",
      currentStage: "STAGE_0",
      status: "PENDING_REVIEW",
      startDate: new Date("2023-03-20"),
      budget: 2500000,
      budgetUtilization: 20,
      technologyReadiness: "TRL-3",
      ipPotential: "Very High",
      duration: 24,
      clusterId: smartPlacesCluster.id,
      leadId: projectLead2.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      projectId: "STP-7890",
      name: "Waste Management Sensors",
      description: "Smart sensors for optimized waste collection routes",
      businessCase:
        "Optimize waste collection efficiency by 40% and reduce operational costs through smart routing algorithms.",
      currentStage: "STAGE_2",
      status: "RED_FLAG",
      startDate: new Date("2023-01-10"),
      budget: 800000,
      budgetUtilization: 65,
      technologyReadiness: "TRL-5",
      ipPotential: "Medium",
      duration: 12,
      clusterId: smartPlacesCluster.id,
      leadId: projectLead1.id,
    },
  });

  // Create project members
  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project1.id,
        userId: researcher1.id,
        role: "Senior Researcher",
      },
      {
        projectId: project2.id,
        userId: projectLead1.id,
        role: "Technical Advisor",
      },
      {
        projectId: project3.id,
        userId: researcher1.id,
        role: "Technical Reviewer",
      },
    ],
  });

  // Create gate reviews
  await prisma.gateReview.createMany({
    data: [
      {
        projectId: project1.id,
        stage: "STAGE_0",
        reviewerId: adminUser.id,
        decision: "GO",
        score: 8.5,
        comments:
          "Strong business case and technical feasibility demonstrated.",
        reviewDate: new Date("2023-02-01"),
        isCompleted: true,
      },
      {
        projectId: project2.id,
        stage: "STAGE_0",
        reviewerId: adminUser.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false,
      },
    ],
  });

  // Create documents
  await prisma.document.createMany({
    data: [
      {
        projectId: project1.id,
        uploaderId: projectLead1.id,
        name: "Business Case v1.2",
        description: "Updated business case with market analysis",
        type: "BUSINESS_CASE",
        fileUrl:
          "https://sharepoint.csir.co.za/sites/projects/STP-5678/business-case-v1.2.pdf",
        fileName: "business-case-v1.2.pdf",
        fileSize: 2048576,
        mimeType: "application/pdf",
        isRequired: true,
        isApproved: true,
        approvedAt: new Date(),
        version: "1.2",
      },
      {
        projectId: project1.id,
        uploaderId: projectLead1.id,
        name: "Technical Specifications",
        description: "Detailed technical specifications for IoT sensors",
        type: "TECHNICAL_SPEC",
        fileUrl:
          "https://sharepoint.csir.co.za/sites/projects/STP-5678/tech-specs.docx",
        fileName: "tech-specs.docx",
        fileSize: 1024768,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        isRequired: true,
        isApproved: false,
        version: "1.0",
      },
    ],
  });

  // Create red flags
  await prisma.redFlag.create({
    data: {
      projectId: project3.id,
      raisedById: adminUser.id,
      title: "Budget Overrun Risk",
      description:
        "Project is approaching 70% budget utilization with only 50% completion. Risk of budget overrun identified.",
      severity: "HIGH",
      status: "OPEN",
    },
  });

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: projectLead1.id,
        projectId: project1.id,
        action: "PROJECT_CREATED",
        details: "Created new project: Smart Water Meter",
      },
      {
        userId: adminUser.id,
        projectId: project1.id,
        action: "GATE_REVIEWED",
        details: "Completed Gate 0 review with GO decision",
      },
      {
        userId: projectLead1.id,
        projectId: project1.id,
        action: "DOCUMENT_UPLOADED",
        details: "Uploaded Business Case v1.2",
      },
      {
        userId: adminUser.id,
        projectId: project3.id,
        action: "RED_FLAG_RAISED",
        details: "Raised red flag: Budget Overrun Risk",
      },
    ],
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: projectLead1.id,
        type: "GATE_REVIEW",
        title: "Gate Review Completed",
        message: "Your project Smart Water Meter has passed Gate 0 review",
        isRead: false,
      },
      {
        userId: researcher1.id,
        type: "RED_FLAG",
        title: "Red Flag Raised",
        message:
          "A red flag has been raised on Waste Management Sensors project",
        isRead: false,
      },
    ],
  });

  // Create templates
  await prisma.template.createMany({
    data: [
      {
        name: "Business Case Template",
        description: "Standard template for project business cases",
        type: "BUSINESS_CASE",
        stage: "STAGE_0",
        fileUrl:
          "https://sharepoint.csir.co.za/sites/templates/business-case-template.docx",
        fileName: "business-case-template.docx",
        isActive: true,
      },
      {
        name: "Technical Specification Template",
        description: "Template for technical specifications",
        type: "TECHNICAL_SPEC",
        stage: "STAGE_1",
        fileUrl:
          "https://sharepoint.csir.co.za/sites/templates/tech-spec-template.docx",
        fileName: "tech-spec-template.docx",
        isActive: true,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
