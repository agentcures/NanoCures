---
name: nanocures-rank-portfolio
description: Rank disease programs with deterministic weighted scoring and optional budget allocation. Main channel only.
---

# /nanocures-rank-portfolio

Rank a disease portfolio from JSON input.

## Main-channel check

```bash
test -d /workspace/project && echo "MAIN" || echo "NOT_MAIN"
```

If `NOT_MAIN`, stop and redirect the user to the main chat.

## Workflow

1. Use `/workspace/project/templates/portfolio-input.json` when the user needs a starting schema.
2. Save the input under `/workspace/group/portfolios/`.
3. Run:

```bash
node /workspace/project/tools/nanocures-cli.mjs rank-portfolio <input-file> --output <output-file>
```

4. If the user supplied a total budget, add `--total-budget <amount>`.
5. Report the ranked output and file path.
