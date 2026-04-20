---
name: nanocures-run
description: Run a single NanoCures planning and execution pass with a saved plan and run artifact. Main channel only.
---

# /nanocures-run

Run a single NanoCures campaign cycle and save reproducible artifacts.

## Main-channel check

```bash
test -d /workspace/project && echo "MAIN" || echo "NOT_MAIN"
```

If `NOT_MAIN`, tell the user this workflow must run from the main control chat and stop.

## Workflow

1. Determine the campaign objective from the user message.
2. Create a slug and target files under `/workspace/group/campaigns/`.
3. Copy the templates you need:

```bash
cp /workspace/project/templates/plan-template.json /workspace/group/campaigns/<slug>-plan.json
cp /workspace/project/templates/run-template.json /workspace/group/campaigns/<slug>-run.json
```

4. Build an evidence-first plan with staged calls.
5. Validate it before execution:

```bash
node /workspace/project/tools/nanocures-cli.mjs validate-plan /workspace/group/campaigns/<slug>-plan.json \
  --max-calls 12 \
  --enforce-stage-progression \
  --require-evidence-before-hypothesis
```

6. Execute the work yourself using available tools such as `WebSearch`, `WebFetch`, `Bash`, `Read`, and `Write`.
7. Fill the run artifact with:

- `objective`
- `plan`
- `policy`
- `evidence`
- `promising_cures`
- `interesting_targets`
- `execution_log`
- `references`
- `next_actions`

8. Report the key findings and name the files written.

## Standards

- Gather evidence before proposing candidates.
- Separate sourced facts from your inference.
- Use exact dates for unstable facts.
- Do not claim cures; describe candidate programs and evidence strength.
