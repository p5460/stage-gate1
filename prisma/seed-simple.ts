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

  const gatekeeper = await prisma.user.upsert({
    where: { email: "gatekeeper@csir.co.za" },
    update: {},
    create: {
      name: "Prof. Mike Brown",
      email: "gatekeeper@csir.co.za",
      password: hashedPassword,
      role: "GATEKEEPER",
      department: "Smart Places",
      position: "Senior Gatekeeper",
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

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@csir.co.za" },
    update: {},
    create: {
      name: "Dr. James Wilson",
      email: "reviewer@csir.co.za",
      password: hashedPassword,
      role: "REVIEWER",
      department: "Smart Places",
      position: "Technical Reviewer",
      emailVerified: new Date(),
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: "user@csir.co.za" },
    update: {},
    create: {
      name: "Alice Cooper",
      email: "user@csir.co.za",
      password: hashedPassword,
      role: "USER",
      department: "Smart Places",
      position: "Research Assistant",
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
      leadId: projectLead1.id,
    },
  });

  // Create project members
  await prisma.projectMember.create({
    data: {
      projectId: project1.id,
      userId: researcher1.id,
      role: "Senior Researcher",
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project2.id,
      userId: researcher1.id,
      role: "Technical Advisor",
    },
  });

  // Create gate reviews
  await prisma.gateReview.create({
    data: {
      projectId: project1.id,
      stage: "STAGE_0",
      reviewerId: gatekeeper.id,
      decision: "GO",
      score: 8.5,
      comments: "Strong business case and technical feasibility demonstrated.",
      reviewDate: new Date("2023-02-01"),
      isCompleted: true,
    },
  });

  await prisma.gateReview.create({
    data: {
      projectId: project2.id,
      stage: "STAGE_0",
      reviewerId: reviewer.id,
      decision: null,
      score: null,
      comments: null,
      reviewDate: null,
      isCompleted: false,
    },
  });

  // Create some comments
  await prisma.comment.create({
    data: {
      content:
        "Great progress on the water meter project! The IoT integration looks promising.",
      authorId: researcher1.id,
      projectId: project1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "We need to review the budget allocation for the AI components.",
      authorId: projectLead1.id,
      projectId: project2.id,
    },
  });

  // Create milestones
  await prisma.milestone.create({
    data: {
      projectId: project1.id,
      title: "Prototype Development",
      description:
        "Complete the first working prototype of the smart water meter",
      dueDate: new Date("2024-06-30"),
      progress: 75,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: project1.id,
      title: "Field Testing",
      description: "Deploy prototypes for field testing in selected areas",
      dueDate: new Date("2024-09-30"),
      progress: 25,
    },
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: projectLead1.id,
      type: "GATE_REVIEW",
      title: "Gate Review Completed",
      message: "Your project Smart Water Meter has passed Gate 0 review",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: researcher1.id,
      type: "PROJECT_UPDATE",
      title: "Project Assignment",
      message: "You have been added to the Urban Traffic AI project",
      isRead: false,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("👤 Test users created:");
  console.log("   Admin: admin@csir.co.za / password123");
  console.log("   Gatekeeper: gatekeeper@csir.co.za / password123");
  console.log("   Project Lead: sarah.johnson@csir.co.za / password123");
  console.log("   Researcher: linda.williams@csir.co.za / password123");
  console.log("   Reviewer: reviewer@csir.co.za / password123");
  console.log("   User: user@csir.co.za / password123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
