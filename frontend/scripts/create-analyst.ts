/**
 * HRIP Admin CLI — Create Analyst Account
 * Usage: npx ts-node scripts/create-analyst.ts --email=x@y.com --name="John Doe" --password=Pass123
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const get = (key: string) => {
    const arg = args.find(a => a.startsWith(`--${key}=`));
    return arg ? arg.split("=").slice(1).join("=") : null;
  };

  const email = get("email");
  const name = get("name");
  const password = get("password");

  if (!email || !name || !password) {
    console.error("\n❌ Missing required arguments.");
    console.error("   Usage: npx ts-node scripts/create-analyst.ts --email=x@y.com --name=\"John Doe\" --password=Pass123\n");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();

  // Check if already exists
  const existing = await prisma.analyst.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    console.log(`\n⚠️  Analyst with email ${normalizedEmail} already exists.`);
    if (!existing.isApproved) {
      await prisma.analyst.update({ where: { id: existing.id }, data: { isApproved: true } });
      console.log("   ✅ Account was unapproved — now approved.\n");
    } else {
      console.log("   Account is already active and approved.\n");
    }
    await prisma.$disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const analyst = await prisma.analyst.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
      isApproved: true,
      approvedBy: "system-admin",
    }
  });

  console.log("\n✅ Analyst account created successfully!");
  console.log(`   Name:     ${analyst.name}`);
  console.log(`   Email:    ${analyst.email}`);
  console.log(`   Approved: ${analyst.isApproved}`);
  console.log(`   ID:       ${analyst.id}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\n❌ Error creating analyst:", e.message, "\n");
  await prisma.$disconnect();
  process.exit(1);
});
