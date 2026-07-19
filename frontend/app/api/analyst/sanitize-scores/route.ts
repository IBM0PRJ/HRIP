import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { getAnalystFromRequest } from "../../../../lib/session";

/**
 * POST /api/analyst/sanitize-scores
 * One-time analyst-only endpoint to clamp all employee risk scores
 * back to the valid 0–100 range. Needed after the telemetry
 * uncapped-increment bug allowed scores to reach 1000+.
 */
export async function POST() {
  try {
    const analyst = await getAnalystFromRequest();
    if (!analyst) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all employees with a score above 100
    const corrupted = await prisma.employee.findMany({
      where: { riskScore: { gt: 100 } },
      select: { id: true, name: true, email: true, riskScore: true }
    });

    if (corrupted.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No corrupted scores found. All employees are within 0–100.",
        fixed: 0
      });
    }

    // Clamp each one individually so we get accurate before/after values
    const results = await Promise.all(
      corrupted.map(async (emp) => {
        const clampedScore = Math.min(100, Math.max(0, emp.riskScore));
        await prisma.employee.update({
          where: { id: emp.id },
          data: { riskScore: clampedScore }
        });
        return {
          email: emp.email,
          name: emp.name,
          before: emp.riskScore,
          after: clampedScore
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: `Clamped ${results.length} employee score(s) back to 0–100 range.`,
      fixed: results.length,
      details: results
    });
  } catch (error) {
    console.error("Sanitize scores error:", error);
    return NextResponse.json({ error: "Failed to sanitize scores" }, { status: 500 });
  }
}
