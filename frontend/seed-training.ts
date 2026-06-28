import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modules = [
  {
    title: "Phishing Identification Mastery",
    topic: "phishing",
    difficulty: "beginner",
    questions: JSON.stringify([
      { q: "What is the most common indicator of a phishing email?", options: ["Urgent language", "Correct spelling", "Known sender"], correct: 0 },
      { q: "Should you click links in unexpected emails?", options: ["Yes, to check them", "No, verify first", "Only if it looks official"], correct: 1 },
      { q: "What should you do with a suspected phishing email?", options: ["Reply and ask", "Forward to a friend", "Report to IT"], correct: 2 }
    ]),
    passMark: 2
  },
  {
    title: "Secure Password Practices",
    topic: "passwords",
    difficulty: "intermediate",
    questions: JSON.stringify([
      { q: "What makes a password strong?", options: ["Using your pet's name", "Using a mix of characters and length", "Using 'password123'"], correct: 1 },
      { q: "How often should you reuse passwords?", options: ["Always", "Only for unimportant accounts", "Never"], correct: 2 },
      { q: "What is MFA?", options: ["Multi-Factor Authentication", "Main File Access", "More Frequent Alerts"], correct: 0 }
    ]),
    passMark: 2
  },
  {
    title: "USB Security Basics",
    topic: "usb_security",
    difficulty: "beginner",
    questions: JSON.stringify([
      { q: "What should you do if you find a USB drive in the parking lot?", options: ["Plug it in to find the owner", "Give it to IT", "Keep it for personal use"], correct: 1 },
      { q: "Can a USB drive contain malware?", options: ["Yes, even if it looks empty", "No, they are safe", "Only if it's plugged into a Mac"], correct: 0 },
      { q: "Should you charge your phone using a public USB port?", options: ["Yes, it's convenient", "No, use a power adapter", "Only if it's urgent"], correct: 1 }
    ]),
    passMark: 2
  }
];

async function main() {
  console.log("Seeding training modules...");
  
  for (const mod of modules) {
    await prisma.trainingModule.create({
      data: mod
    });
  }
  
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
