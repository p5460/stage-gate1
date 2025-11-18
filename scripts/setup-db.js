#!/usr/bin/env node

const { execSync } = require("child_process");

console.log("🔧 Setting up database...");

try {
  console.log("📦 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });

  console.log("🗄️ Pushing database schema...");
  execSync("npx prisma db push", { stdio: "inherit" });

  console.log("🌱 Seeding database...");
  execSync("npx prisma db seed", { stdio: "inherit" });

  console.log("✅ Database setup complete!");
} catch (error) {
  console.error("❌ Database setup failed:", error.message);
  process.exit(1);
}
