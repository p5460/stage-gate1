import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  try {
    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected");

    // Create a simple cluster first
    const cluster = await prisma.cluster.upsert({
      where: { name: "Smart Places" },
      update: {},
      create: {
        name: "Smart Places",
        description: "Smart city and urban technology solutions",
        color: "#3B82F6",
      },
    });
    console.log("✅ Cluster created:", cluster.name);

    // Create admin user
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
        position: "System Administrator",
        emailVerified: new Date(),
      },
    });
    console.log("✅ Admin user created:", adminUser.email);

    console.log("✅ Database seeded successfully!");
    console.log("👤 Login with: admin@csir.co.za / password123");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
