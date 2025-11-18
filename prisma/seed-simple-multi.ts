import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with multi-reviewer system data...");

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

  const healthCluster = await prisma.cluster.upsert({
    where: { name: "Health" },
    update: {},
    create: {
      name: "Health",
      description: "Healthcare and medical technology research",
      color: "#10B981",
    },
  });

  const energyCluster = await prisma.cluster.upsert({
    where: { name: "Energy" },
    update: {},
    create: {
      name: "Energy",
      description: "Renewable energy and sustainability solutions",
      color: "#F59E0B",
    },
  });

  // Create users with different roles for multi-reviewer system
  const hashedPassword = await bcrypt.hash("password123", 12);

  // Administrators
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@csir.co.za" },
    update: {},
    create: {
      name: "Dr. John Smith",
      email: "admin@csir.co.za",
      password: hashedPassword,
      role: "ADMIN",
      department: "Administration",
      position: "System Administrator",
      emailVerified: new Date(),
    },
  });

  // Gatekeepers
  const gatekeeper1 = await prisma.user.upsert({
    where: { email: "gatekeeper1@csir.co.za" },
    update: {},
    create: {
      name: "Prof. Maria Garcia",
      email: "gatekeeper1@csir.co.za",
      password: hashedPassword,
      role: "GATEKEEPER",
      department: "Smart Places",
      position: "Senior Gatekeeper - Smart Places",
      emailVerified: new Date(),
    },
  });

  const gatekeeper2 = await prisma.user.upsert({
    where: { email: "gatekeeper2@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Robert Chen",
      email: "gatekeeper2@csir.co.za",
      password: hashedPassword,
      role: "GATEKEEPER",
      department: "Health",
      position: "Senior Gatekeeper - Health",
      emailVerified: new Date(),
    },
  });

  // Reviewers
  const reviewer1 = await prisma.user.upsert({
    where: { email: "reviewer1@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Sarah Johnson",
      email: "reviewer1@csir.co.za",
      password: hashedPassword,
      role: "REVIEWER",
      department: "Smart Places",
      position: "Senior Technical Reviewer",
      emailVerified: new Date(),
    },
  });

  const reviewer2 = await prisma.user.upsert({
    where: { email: "reviewer2@csir.co.za" },
    update: {},
    create: {
      name: "Prof. Michael Brown",
      email: "reviewer2@csir.co.za",
      password: hashedPassword,
      role: "REVIEWER",
      department: "Smart Places",
      position: "Technology Assessment Specialist",
      emailVerified: new Date(),
    },
  });

  const reviewer3 = await prisma.user.upsert({
    where: { email: "reviewer3@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Linda Williams",
      email: "reviewer3@csir.co.za",
      password: hashedPassword,
      role: "REVIEWER",
      department: "Energy",
      position: "Innovation Reviewer",
      emailVerified: new Date(),
    },
  });

  const reviewer4 = await prisma.user.upsert({
    where: { email: "reviewer4@csir.co.za" },
    update: {},
    create: {
      name: "Dr. James Wilson",
      email: "reviewer4@csir.co.za",
      password: hashedPassword,
      role: "REVIEWER",
      department: "Health",
      position: "Medical Technology Reviewer",
      emailVerified: new Date(),
    },
  });

  // Project Leads
  const projectLead1 = await prisma.user.upsert({
    where: { email: "lead1@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Emma Davis",
      email: "lead1@csir.co.za",
      password: hashedPassword,
      role: "PROJECT_LEAD",
      department: "Smart Places",
      position: "Principal Investigator",
      emailVerified: new Date(),
    },
  });

  const projectLead2 = await prisma.user.upsert({
    where: { email: "lead2@csir.co.za" },
    update: {},
    create: {
      name: "Prof. David Martinez",
      email: "lead2@csir.co.za",
      password: hashedPassword,
      role: "PROJECT_LEAD",
      department: "Health",
      position: "Research Director",
      emailVerified: new Date(),
    },
  });

  const projectLead3 = await prisma.user.upsert({
    where: { email: "lead3@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Anna Thompson",
      email: "lead3@csir.co.za",
      password: hashedPassword,
      role: "PROJECT_LEAD",
      department: "Energy",
      position: "Innovation Lead",
      emailVerified: new Date(),
    },
  });

  // Researchers
  const researcher1 = await prisma.user.upsert({
    where: { email: "researcher1@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Kevin Lee",
      email: "researcher1@csir.co.za",
      password: hashedPassword,
      role: "RESEARCHER",
      department: "Smart Places",
      position: "Senior Researcher",
      emailVerified: new Date(),
    },
  });

  const researcher2 = await prisma.user.upsert({
    where: { email: "researcher2@csir.co.za" },
    update: {},
    create: {
      name: "Dr. Sophie Anderson",
      email: "researcher2@csir.co.za",
      password: hashedPassword,
      role: "RESEARCHER",
      department: "Health",
      position: "Biomedical Researcher",
      emailVerified: new Date(),
    },
  });

  // Create projects with different stages for multi-reviewer testing
  const project1 = await prisma.project.create({
    data: {
      projectId: "STP-2024-001",
      name: "Smart Water Management System",
      description:
        "IoT-based water monitoring and leak detection system for urban infrastructure",
      businessCase:
        "Reduce water loss by 30% through early leak detection and real-time monitoring. Estimated savings of R2.5M annually across pilot municipalities.",
      currentStage: "STAGE_0",
      status: "PENDING_REVIEW",
      startDate: new Date("2024-01-15"),
      budget: 1500000,
      budgetUtilization: 15,
      technologyReadiness: "TRL-3",
      ipPotential: "High",
      duration: 18,
      clusterId: smartPlacesCluster.id,
      leadId: projectLead1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      projectId: "HTH-2024-002",
      name: "AI-Powered Diagnostic Tool",
      description:
        "Machine learning system for early disease detection using medical imaging",
      businessCase:
        "Improve diagnostic accuracy by 25% and reduce diagnosis time by 50%. Potential to save 1000+ lives annually through early detection.",
      currentStage: "STAGE_1",
      status: "ACTIVE",
      startDate: new Date("2024-02-01"),
      budget: 2200000,
      budgetUtilization: 35,
      technologyReadiness: "TRL-4",
      ipPotential: "Very High",
      duration: 24,
      clusterId: healthCluster.id,
      leadId: projectLead2.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      projectId: "ENR-2024-003",
      name: "Solar Panel Efficiency Optimizer",
      description:
        "AI-driven system to optimize solar panel positioning and energy output",
      businessCase:
        "Increase solar energy efficiency by 20% through intelligent positioning algorithms. ROI of 300% over 5 years.",
      currentStage: "STAGE_2",
      status: "ACTIVE",
      startDate: new Date("2023-11-01"),
      budget: 1800000,
      budgetUtilization: 60,
      technologyReadiness: "TRL-5",
      ipPotential: "High",
      duration: 20,
      clusterId: energyCluster.id,
      leadId: projectLead3.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      projectId: "STP-2024-004",
      name: "Urban Traffic Flow AI",
      description:
        "Intelligent traffic management system using computer vision and ML",
      businessCase:
        "Reduce traffic congestion by 35% and emissions by 20%. Estimated economic impact of R50M annually.",
      currentStage: "STAGE_1",
      status: "PENDING_REVIEW",
      startDate: new Date("2024-03-01"),
      budget: 3000000,
      budgetUtilization: 25,
      technologyReadiness: "TRL-3",
      ipPotential: "Very High",
      duration: 30,
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
        projectId: project1.id,
        userId: reviewer1.id,
        role: "Technical Advisor",
      },
      {
        projectId: project2.id,
        userId: researcher2.id,
        role: "Lead Researcher",
      },
      { projectId: project2.id, userId: reviewer4.id, role: "Medical Advisor" },
      {
        projectId: project3.id,
        userId: researcher1.id,
        role: "Technical Consultant",
      },
      { projectId: project4.id, userId: researcher1.id, role: "AI Specialist" },
      {
        projectId: project4.id,
        userId: reviewer2.id,
        role: "Technology Reviewer",
      },
    ],
  });

  // Create multiple gate reviews for multi-reviewer scenarios (without sessionId)

  // Project 1 - Stage 0 - Multiple reviewers assigned but not all completed
  await prisma.gateReview.createMany({
    data: [
      {
        projectId: project1.id,
        stage: "STAGE_0",
        reviewerId: reviewer1.id,
        decision: "GO",
        score: 4.2,
        comments:
          "Strong technical foundation and clear market need. Recommend proceeding with prototype development.",
        reviewDate: new Date("2024-01-20"),
        isCompleted: true,
      },
      {
        projectId: project1.id,
        stage: "STAGE_0",
        reviewerId: reviewer2.id,
        decision: "GO",
        score: 4.5,
        comments:
          "Excellent business case with solid ROI projections. Technology approach is sound and feasible.",
        reviewDate: new Date("2024-01-22"),
        isCompleted: true,
      },
      {
        projectId: project1.id,
        stage: "STAGE_0",
        reviewerId: gatekeeper1.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Pending review
      },
    ],
  });

  // Project 2 - Stage 0 - All reviews completed, Stage 1 - Some reviews pending
  await prisma.gateReview.createMany({
    data: [
      // Stage 0 - Completed
      {
        projectId: project2.id,
        stage: "STAGE_0",
        reviewerId: reviewer4.id,
        decision: "GO",
        score: 4.8,
        comments:
          "Exceptional medical application with high impact potential. Strong regulatory pathway identified.",
        reviewDate: new Date("2024-02-05"),
        isCompleted: true,
      },
      {
        projectId: project2.id,
        stage: "STAGE_0",
        reviewerId: gatekeeper2.id,
        decision: "GO",
        score: 4.6,
        comments:
          "Well-structured project with clear milestones. Recommend advancement to Stage 1.",
        reviewDate: new Date("2024-02-07"),
        isCompleted: true,
      },
      // Stage 1 - Mixed completion
      {
        projectId: project2.id,
        stage: "STAGE_1",
        reviewerId: reviewer1.id,
        decision: "GO",
        score: 4.3,
        comments:
          "Technical progress is on track. AI model showing promising results in preliminary testing.",
        reviewDate: new Date("2024-03-15"),
        isCompleted: true,
      },
      {
        projectId: project2.id,
        stage: "STAGE_1",
        reviewerId: reviewer4.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Pending review
      },
      {
        projectId: project2.id,
        stage: "STAGE_1",
        reviewerId: adminUser.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Pending review
      },
    ],
  });

  // Project 3 - Multiple stages with various completion states
  await prisma.gateReview.createMany({
    data: [
      // Stage 0 - Completed
      {
        projectId: project3.id,
        stage: "STAGE_0",
        reviewerId: reviewer3.id,
        decision: "GO",
        score: 4.4,
        comments:
          "Innovative approach to solar optimization. Strong environmental and economic benefits.",
        reviewDate: new Date("2023-11-15"),
        isCompleted: true,
      },
      // Stage 1 - Completed
      {
        projectId: project3.id,
        stage: "STAGE_1",
        reviewerId: reviewer1.id,
        decision: "GO",
        score: 4.1,
        comments:
          "Technical feasibility confirmed. Prototype testing shows 18% efficiency improvement.",
        reviewDate: new Date("2024-01-10"),
        isCompleted: true,
      },
      {
        projectId: project3.id,
        stage: "STAGE_1",
        reviewerId: gatekeeper1.id,
        decision: "GO",
        score: 4.3,
        comments:
          "Project meeting all milestones. Ready for pilot implementation phase.",
        reviewDate: new Date("2024-01-12"),
        isCompleted: true,
      },
      // Stage 2 - In progress
      {
        projectId: project3.id,
        stage: "STAGE_2",
        reviewerId: reviewer3.id,
        decision: "RECYCLE",
        score: 3.2,
        comments:
          "Pilot results are mixed. Recommend addressing scalability concerns before proceeding.",
        reviewDate: new Date("2024-03-20"),
        isCompleted: true,
      },
      {
        projectId: project3.id,
        stage: "STAGE_2",
        reviewerId: adminUser.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Pending review
      },
    ],
  });

  // Project 4 - Fresh project with reviewers assigned
  await prisma.gateReview.createMany({
    data: [
      {
        projectId: project4.id,
        stage: "STAGE_1",
        reviewerId: reviewer1.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Newly assigned
      },
      {
        projectId: project4.id,
        stage: "STAGE_1",
        reviewerId: reviewer2.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Newly assigned
      },
      {
        projectId: project4.id,
        stage: "STAGE_1",
        reviewerId: gatekeeper1.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Newly assigned
      },
    ],
  });

  // Create documents for projects
  await prisma.document.createMany({
    data: [
      {
        projectId: project1.id,
        uploaderId: projectLead1.id,
        name: "Business Case - Smart Water Management",
        description:
          "Comprehensive business case with market analysis and ROI projections",
        type: "BUSINESS_CASE",
        fileUrl:
          "https://sharepoint.csir.co.za/sites/projects/STP-2024-001/business-case.pdf",
        fileName: "business-case-v2.1.pdf",
        fileSize: 2048576,
        mimeType: "application/pdf",
        isRequired: true,
        isApproved: true,
        approvedAt: new Date(),
        version: "2.1",
      },
      {
        projectId: project2.id,
        uploaderId: projectLead2.id,
        name: "Technical Specifications - AI Diagnostic Tool",
        description:
          "Detailed technical specifications for ML algorithms and data processing",
        type: "TECHNICAL_SPEC",
        fileUrl:
          "https://sharepoint.csir.co.za/sites/projects/HTH-2024-002/tech-specs.docx",
        fileName: "ai-diagnostic-specs-v1.3.docx",
        fileSize: 1536000,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        isRequired: true,
        isApproved: true,
        approvedAt: new Date(),
        version: "1.3",
      },
      {
        projectId: project3.id,
        uploaderId: projectLead3.id,
        name: "Pilot Results Report",
        description: "Results from solar panel optimization pilot study",
        type: "MILESTONE_REPORT",
        fileUrl:
          "https://sharepoint.csir.co.za/sites/projects/ENR-2024-003/pilot-results.pdf",
        fileName: "pilot-results-q1-2024.pdf",
        fileSize: 3072000,
        mimeType: "application/pdf",
        isRequired: false,
        isApproved: true,
        approvedAt: new Date(),
        version: "1.0",
      },
    ],
  });

  // Create notifications for multi-reviewer system
  await prisma.notification.createMany({
    data: [
      {
        userId: gatekeeper1.id,
        type: "GATE_REVIEW",
        title: "Review Assignment",
        message:
          "You have been assigned to review Smart Water Management System for Stage 0",
        isRead: false,
        data: {
          projectId: project1.id,
          stage: "STAGE_0",
        },
      },
      {
        userId: reviewer4.id,
        type: "GATE_REVIEW",
        title: "Review Assignment",
        message:
          "You have been assigned to review AI-Powered Diagnostic Tool for Stage 1",
        isRead: false,
        data: {
          projectId: project2.id,
          stage: "STAGE_1",
        },
      },
      {
        userId: adminUser.id,
        type: "GATE_REVIEW",
        title: "Review Assignment",
        message:
          "You have been assigned to review AI-Powered Diagnostic Tool for Stage 1",
        isRead: false,
        data: {
          projectId: project2.id,
          stage: "STAGE_1",
        },
      },
      {
        userId: projectLead1.id,
        type: "GATE_REVIEW",
        title: "Reviews Completed",
        message:
          "2 out of 3 reviews completed for Smart Water Management System Stage 0",
        isRead: false,
        data: {
          projectId: project1.id,
          completedReviews: 2,
          totalReviews: 3,
        },
      },
    ],
  });

  console.log("✅ Multi-reviewer system database seeded successfully!");
  console.log("\n📊 Seeded Data Summary:");
  console.log("- 3 Clusters (Smart Places, Health, Energy)");
  console.log(
    "- 11 Users (1 Admin, 2 Gatekeepers, 4 Reviewers, 3 Project Leads, 2 Researchers)"
  );
  console.log("- 4 Projects with different stages and review states");
  console.log(
    "- 13 Gate Reviews (various completion states for multi-reviewer testing)"
  );
  console.log("- 7 Project Members");
  console.log("- 3 Documents");
  console.log("- 4 Notifications");
  console.log("\n🔐 Login Credentials (password: password123):");
  console.log("- Admin: admin@csir.co.za");
  console.log("- Gatekeeper 1: gatekeeper1@csir.co.za");
  console.log("- Gatekeeper 2: gatekeeper2@csir.co.za");
  console.log("- Reviewer 1: reviewer1@csir.co.za");
  console.log("- Reviewer 2: reviewer2@csir.co.za");
  console.log("- Reviewer 3: reviewer3@csir.co.za");
  console.log("- Reviewer 4: reviewer4@csir.co.za");
  console.log("- Project Lead 1: lead1@csir.co.za");
  console.log("- Project Lead 2: lead2@csir.co.za");
  console.log("- Project Lead 3: lead3@csir.co.za");
  console.log("\n🎯 Multi-Reviewer Test Scenarios:");
  console.log(
    "- Project STP-2024-001: 2/3 Stage 0 reviews completed (pending gatekeeper approval)"
  );
  console.log(
    "- Project HTH-2024-002: Stage 0 complete, 1/3 Stage 1 reviews completed"
  );
  console.log("- Project ENR-2024-003: Multiple stages, mixed review outcomes");
  console.log(
    "- Project STP-2024-004: Fresh project with 3 reviewers assigned but no reviews started"
  );
  console.log("\n🚀 Ready to test the multi-reviewer system!");
  console.log(
    "Navigate to any project and click 'Review Dashboard' to get started."
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
