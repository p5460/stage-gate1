import { PrismaClient } from "@prisma/client";

// Initialize Prisma client for budget allocation seeding
const prisma = new PrismaClient() as any;

async function main() {
  console.log("🌱 Seeding database with budget allocation data...");

  // Get existing projects and users
  const projects = await prisma.project.findMany({
    include: { lead: true, cluster: true },
  });

  const users = await prisma.user.findMany();

  if (projects.length === 0 || users.length === 0) {
    console.log(
      "❌ No projects or users found. Please run the main seed first."
    );
    return;
  }

  // Find admin and gatekeeper users for approvals
  const adminUser = users.find((u: any) => u.role === "ADMIN");
  const gatekeeperUser = users.find((u: any) => u.role === "GATEKEEPER");

  console.log(`📊 Found ${projects.length} projects and ${users.length} users`);

  // Budget categories with realistic amounts
  const budgetCategories = [
    { category: "Personnel", subcategory: "Salaries", baseAmount: 500000 },
    { category: "Personnel", subcategory: "Benefits", baseAmount: 100000 },
    { category: "Personnel", subcategory: "Consultants", baseAmount: 200000 },
    {
      category: "Equipment",
      subcategory: "Laboratory Equipment",
      baseAmount: 300000,
    },
    {
      category: "Equipment",
      subcategory: "Computing Equipment",
      baseAmount: 150000,
    },
    { category: "Equipment", subcategory: "Software", baseAmount: 50000 },
    { category: "Materials", subcategory: "Consumables", baseAmount: 75000 },
    { category: "Materials", subcategory: "Chemicals", baseAmount: 100000 },
    { category: "Travel", subcategory: "Domestic Travel", baseAmount: 50000 },
    {
      category: "Travel",
      subcategory: "International Travel",
      baseAmount: 120000,
    },
    {
      category: "Overhead",
      subcategory: "Administrative Costs",
      baseAmount: 80000,
    },
    {
      category: "Other Direct Costs",
      subcategory: "Publication Fees",
      baseAmount: 25000,
    },
  ];

  const budgetDescriptions: Record<string, Record<string, string>> = {
    Personnel: {
      Salaries: "Monthly salaries for research staff and project team members",
      Benefits:
        "Medical aid, pension contributions, and other employee benefits",
      Consultants: "External consultants and specialist expertise",
    },
    Equipment: {
      "Laboratory Equipment":
        "Specialized laboratory instruments and testing equipment",
      "Computing Equipment":
        "Servers, workstations, and computing infrastructure",
      Software: "Software licenses, development tools, and applications",
    },
    Materials: {
      Consumables: "Laboratory consumables, office supplies, and materials",
      Chemicals: "Research chemicals, reagents, and laboratory supplies",
    },
    Travel: {
      "Domestic Travel": "Local travel for project activities and meetings",
      "International Travel":
        "Conference attendance and international collaboration",
    },
    Overhead: {
      "Administrative Costs": "Project administration and management overhead",
    },
    "Other Direct Costs": {
      "Publication Fees": "Journal publication fees and dissemination costs",
    },
  };

  let createdAllocations = 0;
  let createdApprovals = 0;
  let createdExpenses = 0;

  // Create budget allocations for each project
  for (const project of projects) {
    console.log(`💰 Creating budget allocations for project: ${project.name}`);

    // Randomly select 3-6 budget categories per project
    const selectedCategories = budgetCategories
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 3);

    for (const budgetCategory of selectedCategories) {
      // Vary the amount by ±30%
      const variation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
      const allocatedAmount = Math.round(budgetCategory.baseAmount * variation);

      // Determine status (70% approved, 20% pending, 10% rejected)
      const statusRand = Math.random();
      let status: "PENDING" | "APPROVED" | "REJECTED";
      let approvedBy: string | null = null;
      let rejectedBy: string | null = null;
      let approvedAt: Date | null = null;
      let rejectedAt: Date | null = null;
      let spentAmount = 0;
      let remainingAmount = allocatedAmount;

      if (statusRand < 0.7) {
        status = "APPROVED";
        approvedBy = adminUser?.id || gatekeeperUser?.id || null;
        approvedAt = new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ); // Random date in last 30 days
        // For approved allocations, simulate some spending (0-60% of allocation)
        const spentPercentage = Math.random() * 0.6;
        spentAmount = Math.round(allocatedAmount * spentPercentage);
        remainingAmount = allocatedAmount - spentAmount;
      } else if (statusRand < 0.9) {
        status = "PENDING";
      } else {
        status = "REJECTED";
        rejectedBy = adminUser?.id || gatekeeperUser?.id || null;
        rejectedAt = new Date(
          Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
        ); // Random date in last 15 days
        remainingAmount = 0;
      }

      // Create budget allocation
      const budgetAllocation = await prisma.budgetAllocation.create({
        data: {
          projectId: project.id,
          category: budgetCategory.category,
          subcategory: budgetCategory.subcategory,
          description:
            budgetDescriptions[budgetCategory.category]?.[
              budgetCategory.subcategory
            ] ||
            `Budget allocation for ${budgetCategory.category} - ${budgetCategory.subcategory}`,
          allocatedAmount,
          spentAmount,
          remainingAmount,
          status,
          approvedBy,
          approvedAt,
          rejectedBy,
          rejectedAt,
          rejectionReason:
            status === "REJECTED"
              ? "Budget allocation exceeds project limits for this category"
              : null,
          requestedBy: project.leadId,
          requestedAt: new Date(
            Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000
          ), // Random date in last 45 days
        },
      });

      createdAllocations++;

      // Create budget approval record for approved/rejected allocations
      if (status !== "PENDING" && (approvedBy || rejectedBy)) {
        await prisma.budgetApproval.create({
          data: {
            budgetAllocationId: budgetAllocation.id,
            approverId: (approvedBy || rejectedBy)!,
            status: status === "APPROVED" ? "APPROVED" : "REJECTED",
            comments:
              status === "APPROVED"
                ? "Budget allocation approved based on project requirements and available funding."
                : "Budget allocation rejected due to insufficient justification and budget constraints.",
            approvedAmount: status === "APPROVED" ? allocatedAmount : null,
            approvedAt: approvedAt || rejectedAt,
          },
        });

        createdApprovals++;
      }

      // Create expenses for approved allocations with spending
      if (status === "APPROVED" && spentAmount > 0) {
        const numberOfExpenses = Math.floor(Math.random() * 4) + 1; // 1-4 expenses
        let totalExpenseAmount = 0;

        for (
          let i = 0;
          i < numberOfExpenses && totalExpenseAmount < spentAmount;
          i++
        ) {
          const remainingToSpend = spentAmount - totalExpenseAmount;
          const expenseAmount = Math.min(
            Math.round(remainingToSpend * (0.2 + Math.random() * 0.6)), // 20-80% of remaining
            remainingToSpend
          );

          if (expenseAmount <= 0) break;

          // Generate realistic expense descriptions
          const expenseDescriptions: Record<string, string[]> = {
            Personnel: [
              "Monthly salary payment for research assistant",
              "Consultant fees for technical expertise",
              "Overtime compensation for project team",
              "Training and development costs",
            ],
            Equipment: [
              "Laboratory microscope purchase",
              "Computer workstation upgrade",
              "Software license renewal",
              "Equipment maintenance and calibration",
            ],
            Materials: [
              "Laboratory chemicals and reagents",
              "Office supplies and stationery",
              "Research materials and components",
              "Consumable laboratory supplies",
            ],
            Travel: [
              "Conference attendance and accommodation",
              "Domestic travel for field work",
              "International collaboration visit",
              "Local transport for project activities",
            ],
            Overhead: [
              "Administrative support services",
              "Facility usage and utilities",
              "Project management overhead",
              "Communication and IT services",
            ],
            "Other Direct Costs": [
              "Journal publication fees",
              "Patent application costs",
              "Dissemination and outreach activities",
              "External review and evaluation",
            ],
          };

          const categoryDescriptions = expenseDescriptions[
            budgetCategory.category
          ] || ["General project expense"];
          const expenseDescription =
            categoryDescriptions[
              Math.floor(Math.random() * categoryDescriptions.length)
            ];

          // Determine expense status (80% approved, 15% pending, 5% rejected)
          const expenseStatusRand = Math.random();
          let expenseStatus: "PENDING" | "APPROVED" | "REJECTED";
          let expenseApprovedBy: string | null = null;
          let expenseApprovedAt: Date | null = null;

          if (expenseStatusRand < 0.8) {
            expenseStatus = "APPROVED";
            expenseApprovedBy = adminUser?.id || gatekeeperUser?.id || null;
            expenseApprovedAt = new Date(
              Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000
            );
            totalExpenseAmount += expenseAmount;
          } else if (expenseStatusRand < 0.95) {
            expenseStatus = "PENDING";
          } else {
            expenseStatus = "REJECTED";
            expenseApprovedBy = adminUser?.id || gatekeeperUser?.id || null;
            expenseApprovedAt = new Date(
              Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000
            );
          }

          await prisma.budgetExpense.create({
            data: {
              budgetAllocationId: budgetAllocation.id,
              description: expenseDescription,
              amount: expenseAmount,
              expenseDate: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ), // Random date in last 30 days
              receiptUrl:
                Math.random() > 0.3
                  ? `https://receipts.example.com/receipt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}.pdf`
                  : null,
              approvedBy: expenseApprovedBy,
              approvedAt: expenseApprovedAt,
              status: expenseStatus,
              submittedBy: project.leadId,
            },
          });

          createdExpenses++;
        }
      }
    }
  }

  // Create some additional pending allocations for demonstration
  console.log("📋 Creating additional pending budget allocations for demo...");

  const pendingAllocations = [
    {
      projectId: projects[0].id,
      category: "Equipment",
      subcategory: "Laboratory Equipment",
      description: "High-precision analytical balance for materials testing",
      allocatedAmount: 85000,
      requestedBy: projects[0].leadId,
    },
    {
      projectId: projects[1]?.id || projects[0].id,
      category: "Personnel",
      subcategory: "Consultants",
      description: "International expert consultation for project validation",
      allocatedAmount: 150000,
      requestedBy: projects[1]?.leadId || projects[0].leadId,
    },
    {
      projectId: projects[2]?.id || projects[0].id,
      category: "Travel",
      subcategory: "International Travel",
      description:
        "Conference presentation and networking at international symposium",
      allocatedAmount: 75000,
      requestedBy: projects[2]?.leadId || projects[0].leadId,
    },
  ];

  for (const allocation of pendingAllocations) {
    await prisma.budgetAllocation.create({
      data: {
        ...allocation,
        remainingAmount: allocation.allocatedAmount,
        spentAmount: 0,
        status: "PENDING",
        requestedAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ), // Random date in last 7 days
      },
    });
    createdAllocations++;
  }

  // Create some pending expenses for demonstration
  console.log("💸 Creating pending expense claims for demo...");

  const approvedAllocations = await prisma.budgetAllocation.findMany({
    where: {
      status: "APPROVED",
      remainingAmount: { gt: 0 },
    },
    take: 3,
  });

  for (const allocation of approvedAllocations) {
    const expenseAmount = Math.min(
      Math.round(allocation.remainingAmount * (0.1 + Math.random() * 0.3)), // 10-40% of remaining
      allocation.remainingAmount
    );

    if (expenseAmount > 1000) {
      // Only create if meaningful amount
      await prisma.budgetExpense.create({
        data: {
          budgetAllocationId: allocation.id,
          description: `Recent expense claim for ${allocation.category.toLowerCase()} - ${allocation.subcategory?.toLowerCase()}`,
          amount: expenseAmount,
          expenseDate: new Date(
            Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000
          ), // Random date in last 5 days
          receiptUrl: `https://receipts.example.com/pending-receipt-${Date.now()}.pdf`,
          status: "PENDING",
          submittedBy: allocation.requestedBy,
        },
      });
      createdExpenses++;
    }
  }

  console.log("✅ Budget allocation seeding completed!");
  console.log(`📊 Created ${createdAllocations} budget allocations`);
  console.log(`✅ Created ${createdApprovals} budget approvals`);
  console.log(`💰 Created ${createdExpenses} expense records`);

  // Summary statistics
  const stats = await prisma.budgetAllocation.groupBy({
    by: ["status"],
    _count: { status: true },
    _sum: { allocatedAmount: true },
  });

  console.log("\n📈 Budget Allocation Summary:");
  for (const stat of stats) {
    const totalAmount = stat._sum.allocatedAmount || 0;
    console.log(
      `   ${stat.status}: ${stat._count.status} allocations (R${totalAmount.toLocaleString()})`
    );
  }

  const pendingExpensesCount = await prisma.budgetExpense.count({
    where: { status: "PENDING" },
  });

  console.log(
    `\n💸 Pending Expenses: ${pendingExpensesCount} expense claims awaiting approval`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding budget allocations:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
