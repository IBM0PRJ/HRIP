const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.telemetryLog.deleteMany({
      where: {
        NOT: [
          { message: { contains: '[HIST]' } },
          { message: { contains: '↳ Launched application:' } }
        ]
      }
    });
    console.log("Deleted old logs:", res.count);
  } catch (e) {
    console.error("Prisma Error:", e);
  }
}
main();
