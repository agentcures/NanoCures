# NanoCures Feature Mapping

NanoCures keeps the ClawCures functional surface, but shifts the control plane to NanoClaw.

| ClawCures feature | NanoCures equivalent | Implementation |
|---|---|---|
| Single-run planner and execution | `/nanocures-run` | Claude Agent SDK plans and executes inside the NanoClaw container; artifact shape follows `templates/run-template.json` |
| Planner and critic multi-round loop | `/nanocures-autonomous` | The agent iterates plan, critique, and policy repair, then writes a traceable run artifact |
| Offline plan validation | `/nanocures-validate-plan` | `tools/nanocures-cli.mjs validate-plan` checks call budget, stage order, and evidence-first requirements |
| Portfolio ranking | `/nanocures-rank-portfolio` | `tools/nanocures-cli.mjs rank-portfolio` applies deterministic weighted scoring |
| Translational handoff | `/nanocures-translational-handoff` | `tools/nanocures-cli.mjs translational-handoff` turns run JSON into a markdown brief |
| Regulatory bundle | `/nanocures-regulatory-bundle` | `tools/nanocures-cli.mjs regulatory-bundle` extracts claims, evidence, risks, and references |
| Clinical trial helpers | `/nanocures-clinical-trials` | `tools/nanocures-cli.mjs trials-*` manages a local JSON registry |

## Why NanoClaw Instead Of OpenClaw

ClawCures split planning and execution across OpenClaw plus `refua-mcp`.

NanoCures instead uses the currently documented NanoClaw model:

- a single Node.js orchestrator
- isolated Claude Agent SDK containers
- read-only project-root mount for the main group
- explicit writable mounts for store, group workspace, IPC, and session state
- per-group session isolation
- mount and sender allowlists stored outside the project root

Those choices come from NanoClaw's current docs and upstream repository as inspected on 2026-04-20.
