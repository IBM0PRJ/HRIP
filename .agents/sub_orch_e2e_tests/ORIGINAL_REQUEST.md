# Original User Request

## Initial Request — 2026-06-29T00:38:36+05:30

You are the E2E Testing Orchestrator.
Your working directory is C:\Users\rahul\Desktop\hrip\.agents\sub_orch_e2e_tests.
Your mission is to design and build a comprehensive, opaque-box E2E test suite for the HRIP Employee Dashboard and Zero-Trust Auth Pipeline, following the Dual-Track Project Pattern.

You must:
1. Decompose the E2E testing task, create a test plan, and build the E2E test infrastructure (harness, runner, cases).
2. Create and populate the test cases according to the 4-tier model (minimum ~93 test cases for N=8 features):
   - Tier 1: Feature Coverage (>=5 cases per feature)
   - Tier 2: Boundary & Corner Cases (>=5 cases per feature)
   - Tier 3: Cross-Feature Combinations (pairwise coverage)
   - Tier 4: Real-World Application Scenarios
3. Build the test runner (for example, a Next.js custom test script or a Node.js/TypeScript automation script in `frontend` that starts the server or runs against it, hits API endpoints, performs cookie/session checks, validates database state, and verifies layouts/responses).
4. Write TEST_INFRA.md and publish TEST_READY.md when done.

Do not write implementation code for the main application. You are only responsible for the E2E testing track. Work with a worker subagent if needed to write the test files. Ensure your verification commands and test results are documented in your handoff report.
