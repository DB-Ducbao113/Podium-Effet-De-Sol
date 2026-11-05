---
description: Reproduce and fix a PEDS bug with root-cause evidence and regression checks
---
Bug report: $ARGUMENTS

Read `AGENTS.md` and `docs/AI_DEVELOPMENT_WORKFLOW.md`. First verify `rebuild`; capture baseline HEAD/working tree.
State expected/actual and reproduction steps. Inspect real runtime traces, APIs, data, and relevant source. Isolate the root cause. Where feasible, write a failing regression test, implement minimal fix, then rerun it to green.
Run all applicable static, test, security, browser and build gates. Reject suppression of errors, deleted failing tests and unrelated refactors.
Report root cause, why old coverage missed it, regression evidence, remaining risks, and post-change rebuild branch/remote/CI state.
