# Project Plan — HRIP Employee Dashboard Redesign & Zero-Trust Authentication Pipeline

## Milestones Summary
1. **Milestone 1: E2E Testing Suite Track**
   - Goal: Build E2E test harness and Tier 1-4 test cases; publish `TEST_READY.md`.
   - Status: PLANNED
2. **Milestone 2: Zero-Trust Auth Pipeline (R1 & R2)**
   - Goal: Do not set cookie in login/verify-otp; add `/api/auth/session/issue`; webcam/gps UI popup & holding screen.
   - Status: PLANNED
3. **Milestone 3: Employee Dashboard Redesign & Wiring (R3)**
   - Goal: Sidebar layout conversion & dark luxury visual overhaul, wire all buttons/forms.
   - Status: PLANNED
4. **Milestone 4: Final Verification & Hardening**
   - Goal: Adversarial tests, run all tests, Forensic Audit checks.
   - Status: PLANNED

## Execution Strategy
- Spawning E2E Testing Orchestrator to construct the testing harness and tests (M1).
- Spawning Implementation Worker(s) / Sub-orchestrator(s) sequentially or in parallel for implementation milestones.
- Running liveness timers on active subagents.
