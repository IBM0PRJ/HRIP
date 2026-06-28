import "dotenv/config";
import { TestClient, resetDatabase } from "./harness";
import prisma from "../../lib/db";

async function main() {
  await resetDatabase();

  const emp = await prisma.employee.create({
    data: {
      id: "emp_incident_id",
      name: "Incident Reporter",
      email: "reporter@company.com",
      department: "Marketing",
      passwordHash: "hash",
      isVerified: true
    }
  });

  const client = new TestClient();
  client.setEmployeeSession("emp_incident_id", "reporter@company.com", "Incident Reporter");

  console.log("Cookies set in client:", client.getCookies());

  const res = await client.post("/api/employee/incidents", {
    senderEmail: "phishing@attacker.com",
    subject: "Urgent: Reset Password",
    description: "Received a suspicious link asking to reset password."
  });

  console.log("Response Status:", res.status);
  console.log("Response Headers:", Object.fromEntries(res.headers.entries()));
  console.log("Response Body:", await res.text());
}

main().catch(console.error);
