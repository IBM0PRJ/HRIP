import 'dotenv/config';
import prisma from './lib/db';

async function main() {
  try {
    const res = await prisma.accessRequest.findMany();
    console.log("Success:", res);
  } catch (e) {
    console.error("Failed:", e);
  }
}
main();
