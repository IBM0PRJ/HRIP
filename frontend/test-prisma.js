const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.logRequest.create({
      data: {
        email: "test@example.com",
        startTime: new Date(),
        endTime: new Date(),
        status: "PENDING"
      }
    });
    console.log("Success:", res);
  } catch (e) {
    console.error("Prisma Error:", e);
  }
}
main();
