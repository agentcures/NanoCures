---
name: nanocures-validate-plan
description: Deterministically validate a NanoCures or ClawCures-style JSON plan. Main channel only.
---

# /nanocures-validate-plan

Validate a JSON plan file or JSON pasted by the user.

## Main-channel check

```bash
test -d /workspace/project && echo "MAIN" || echo "NOT_MAIN"
```

If `NOT_MAIN`, stop and explain that this validator is available in the main chat only.

## Command

```bash
node /workspace/project/tools/nanocures-cli.mjs validate-plan <plan-file> \
  --max-calls 12 \
  --enforce-stage-progression \
  --require-evidence-before-hypothesis
```

Summarize:

- approved or rejected
- errors
- warnings
- tool count
