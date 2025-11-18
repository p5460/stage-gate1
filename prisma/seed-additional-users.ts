import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Adding additional users for multi-reviewer system...");

  // Clean up existing test data to avoid conflicts
  console.log("🧹 Cleaning up existing test data...");
  await prisma.gateReview.deleteMany({
    where: {
      projectId: {
        in: ["STP-2024-001", "HTH-2024-002", "STP-2024-004"],
      },
    },
  });
  await prisma.project.deleteMany({
    where: {
      projectId: {
        in: ["STP-2024-001", "HTH-2024-002", "STP-2024-004"],
      },
    },
  });
  console.log("✅ Cleanup complete");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Get existing cluster
  const smartPlacesCluster = await prisma.cluster.findFirst({
    where: { name: "Smart Places" },
  });

  if (!smartPlacesCluster) {
    console.error(
      "Smart Places cluster not found. Please run the main seed first."
    );
    return;
  }

  // Create additional clusters
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

  // Create gatekeepers
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

  // Create reviewers
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

  // Create project leads
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

  // Create projects for multi-reviewer testing
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

  // Create multiple gate reviews for multi-reviewer scenarios

  // Project 1 - Stage 0 - Multiple reviewers with mixed completion
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

  // Project 2 - Stage 1 - Some reviews pending
  await prisma.gateReview.createMany({
    data: [
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
        reviewerId: gatekeeper2.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Pending review
      },
    ],
  });

  // Project 3 - Fresh project with reviewers assigned
  await prisma.gateReview.createMany({
    data: [
      {
        projectId: project3.id,
        stage: "STAGE_1",
        reviewerId: reviewer1.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Newly assigned
      },
      {
        projectId: project3.id,
        stage: "STAGE_1",
        reviewerId: reviewer2.id,
        decision: null,
        score: null,
        comments: null,
        reviewDate: null,
        isCompleted: false, // Newly assigned
      },
      {
        projectId: project3.id,
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

  console.log(
    "✅ Additional users and multi-reviewer data seeded successfully!"
  );
  console.log("\n📊 Added:");
  console.log("- 2 Additional Clusters (Health, Energy)");
  console.log("- 8 New Users (2 Gatekeepers, 4 Reviewers, 2 Project Leads)");
  console.log("- 3 New Projects with multi-reviewer scenarios");
  console.log("- 9 Gate Reviews (various completion states)");
  console.log("\n🔐 Additional Login Credentials (password: password123):");
  console.log("- Gatekeeper 1: gatekeeper1@csir.co.za");
  console.log("- Gatekeeper 2: gatekeeper2@csir.co.za");
  console.log("- Reviewer 1: reviewer1@csir.co.za");
  console.log("- Reviewer 2: reviewer2@csir.co.za");
  console.log("- Reviewer 3: reviewer3@csir.co.za");
  console.log("- Reviewer 4: reviewer4@csir.co.za");
  console.log("- Project Lead 1: lead1@csir.co.za");
  console.log("- Project Lead 2: lead2@csir.co.za");
  console.log("\n🎯 Multi-Reviewer Test Scenarios:");
  console.log("- Project STP-2024-001: 2/3 Stage 0 reviews completed");
  console.log("- Project HTH-2024-002: 1/3 Stage 1 reviews completed");
  console.log(
    "- Project STP-2024-004: 3 reviewers assigned, no reviews started"
  );
  console.log(
    "\n🚀 Ready to test! Navigate to any project and click 'Review Dashboard'"
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding additional data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
