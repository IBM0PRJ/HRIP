import { resetDatabase } from "./harness";
import { tier1Cases } from "./cases/tier1";
import { tier2Cases } from "./cases/tier2";
import { tier3Cases } from "./cases/tier3";
import { tier4Cases } from "./cases/tier4";
import { spawn } from "child_process";
import net from "net";

function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.once("error", onError);
    socket.once("timeout", onError);
    socket.connect(port, "127.0.0.1", () => {
      socket.end();
      resolve(true);
    });
  });
}

async function waitForPort(port: number, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(port)) {
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Port ${port} did not open within ${timeoutMs}ms`);
}

async function main() {
  let serverProcess: any = null;
  
  try {
    const portOpen = await isPortOpen(3000);
    if (!portOpen) {
      console.log("Port 3000 is closed. Starting Next.js dev server...");
      serverProcess = spawn("npm", ["run", "dev"], {
        cwd: "C:\\Users\\rahul\\Desktop\\hrip\\frontend",
        shell: true,
        stdio: "ignore",
        env: {
          ...process.env,
          NODE_ENV: "test",
          SMTP_ENABLED: "false"
        }
      });
      await waitForPort(3000);
      console.log("Next.js dev server is ready!");
    } else {
      console.log("Next.js server is already running on port 3000.");
    }

    const allTiers = [
      { name: "Tier 1: Positive Path Feature Coverage", cases: tier1Cases },
      { name: "Tier 2: Boundary, Corner & Injection Cases", cases: tier2Cases },
      { name: "Tier 3: Cross-Feature Integration Flows", cases: tier3Cases },
      { name: "Tier 4: Real-World Application Scenarios", cases: tier4Cases }
    ];

    let totalRun = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    const failures: { id: string; name: string; error: any }[] = [];

    console.log("\n==================================================");
    console.log("          STARTING E2E TEST EXECUTION             ");
    console.log("==================================================\n");

    for (const tier of allTiers) {
      console.log(`\n>>> Running ${tier.name} (${tier.cases.length} cases)`);
      console.log("--------------------------------------------------");

      for (const testCase of tier.cases) {
        totalRun++;
        process.stdout.write(`[Running] Case ${testCase.id}: ${testCase.name} ... `);
        
        try {
          // Reset DB before every test to guarantee absolute isolation
          await resetDatabase();
          
          // Run the test
          await testCase.fn();
          
          totalPassed++;
          console.log("\x1b[32mPASSED\x1b[0m");
        } catch (err: any) {
          totalFailed++;
          failures.push({ id: testCase.id, name: testCase.name, error: err });
          console.log("\x1b[31mFAILED\x1b[0m");
          console.error(`          Error: ${err.message || err}`);
        }
      }
    }

    console.log("\n==================================================");
    console.log("                TEST RUN SUMMARY                  ");
    console.log("==================================================");
    console.log(`Total Executed: ${totalRun}`);
    console.log(`Passed:         ${totalPassed} / ${totalRun}`);
    console.log(`Failed:         ${totalFailed} / ${totalRun}`);
    console.log("==================================================");

    if (totalFailed > 0) {
      console.log("\nFailing Test Details:");
      for (const fail of failures) {
        console.error(`- [Case ${fail.id}] ${fail.name}: ${fail.error.message || fail.error}`);
      }
      process.exitCode = 1;
    } else {
      console.log("\n\x1b[32mAll 93 E2E test cases passed successfully!\x1b[0m");
      process.exitCode = 0;
    }
  } catch (err: any) {
    console.error("Test runner execution error:", err);
    process.exitCode = 1;
  } finally {
    if (serverProcess) {
      console.log("\nShutting down Next.js dev server...");
      try {
        const { execSync } = require("child_process");
        execSync(`taskkill /pid ${serverProcess.pid} /f /t`);
      } catch (err) {
        serverProcess.kill();
      }
    }
  }
}

main();
