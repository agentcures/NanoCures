---
name: nanocures-autonomous
description: Run a NanoCures planner-critic loop with policy feedback and a saved iteration trace. Main channel only.
---

# /nanocures-autonomous

Run a multi-round NanoCures planner and critic loop.

## Main-channel check

```bash
test -d /workspace/project && echo "MAIN" || echo "NOT_MAIN"
```

If `NOT_MAIN`, stop and tell the user to run this from the main chat.

## Workflow

1. Create campaign plan and run files under `/workspace/group/campaigns/`.
2. For each round:
- produce or refine the plan
- validate it with `nanocures-cli.mjs validate-plan`
- critique missing evidence, stage regressions, unsupported claims, or call-budget issues
- repair the plan
3. Stop when the policy output is approved or when further repair would be low value.
4. Save the final run artifact with an `execution_log` that records the planner and critic rounds.

Use the same evidence-first policy flags as `/nanocures-run`.
