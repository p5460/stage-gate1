import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;

async function main() {
  console.log("🌱 Seeding database with simple budget allocation data...");

  // Get the first project and admin user
  const project = await prisma.project.findFirst({
    include: { lead: true },
  });

  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!project || !adminUser) {
    console.log(
      "❌ No project or admin user found. Please run the main seed first."
    );
    return;
  }

  console.log(`📊 Using project: ${project.name}`);
  console.log(`👤 Using admin: ${adminUser.name}`);

  // Create a few simple budget allocations for testing
  const budgetAllocations = [
    {
      category: "Personnel",
      subcategory: "Salaries",
      description: "Research staff salaries for Q1 2024",
      allocatedAmount: 500000,
      status: "APPROVED" as const,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      spentAmount: 150000,
      remainingAmount: 350000,
    },
    {
      category: "Equipment",
      subcategory: "Laboratory Equipment",
      description: "High-precision measurement instruments",
      allocatedAmount: 250000,
      status: "PENDING" as const,
      spentAmount: 0,
      remainingAmount: 250000,
    },
    {
      category: "Materials",
      subcategory: "Consumables",
      description: "Laboratory consumables and supplies",
      allocatedAmount: 75000,
      status: "APPROVED" as const,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      spentAmount: 25000,
      remainingAmount: 50000,
    },
    {
      category: "Travel",
      subcategory: "International Travel",
      description: "Conference attendance and collaboration visits",
      allocatedAmount: 120000,
      status: "REJECTED" as const,
      rejectedBy: adminUser.id,
      rejectedAt: new Date(),
      rejectionReason: "Travel budget exceeded for this quarter",
      spentAmount: 0,
      remainingAmount: 0,
    },
  ];

  let createdCount = 0;

  for (const allocation of budgetAllocations) {
    const budgetAllocation = await prisma.budgetAllocation.create({
      data: {
        projectId: project.id,
        requestedBy: project.leadId,
        requestedAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
        ...allocation,
      },
    });

    createdCount++;

    // Create approval record for approved/rejected allocations
    if (allocation.status !== "PENDING") {
      await prisma.budgetApproval.create({
        data: {
          budgetAllocationId: budgetAllocation.id,
          approverId: allocation.approvedBy || allocation.rejectedBy!,
          status: allocation.status === "APPROVED" ? "APPROVED" : "REJECTED",
          comments:
            allocation.status === "APPROVED"
              ? "Budget allocation approved for project requirements"
              : allocation.rejectionReason || "Budget allocation rejected",
          approvedAmount:
            allocation.status === "APPROVED"
              ? allocation.allocatedAmount
              : null,
          approvedAt: allocation.approvedAt || allocation.rejectedAt,
        },
      });
    }

    // Create some expenses for approved allocations with spending
    if (allocation.status === "APPROVED" && allocation.spentAmount > 0) {
      await prisma.budgetExpense.create({
        data: {
          budgetAllocationId: budgetAllocation.id,
          description: `Expense for ${allocation.category} - ${allocation.subcategory}`,
          amount: allocation.spentAmount,
          expenseDate: new Date(
            Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
          ),
          receiptUrl: `https://receipts.example.com/receipt-${budgetAllocation.id}.pdf`,
          status: "APPROVED",
          approvedBy: adminUser.id,
          approvedAt: new Date(),
          submittedBy: project.leadId,
        },
      });
    }
  }

  // Create a pending expense for testing
  const approvedAllocation = await prisma.budgetAllocation.findFirst({
    where: {
      status: "APPROVED",
      remainingAmount: { gt: 0 },
    },
  });

  if (approvedAllocation) {
    await prisma.budgetExpense.create({
      data: {
        budgetAllocationId: approvedAllocation.id,
        description: "Pending expense claim for equipment maintenance",
        amount: 15000,
        expenseDate: new Date(),
        receiptUrl: "https://receipts.example.com/pending-expense.pdf",
        status: "PENDING",
        submittedBy: project.leadId,
      },
    });
  }

  console.log(`✅ Created ${createdCount} budget allocations with test data`);
  console.log("🎯 Budget system ready for testing!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding simple budget data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
