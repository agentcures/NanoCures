---
name: nanocures-translational-handoff
description: Convert a NanoCures run artifact into a concise translational handoff brief. Main channel only.
---

# /nanocures-translational-handoff

Build a markdown handoff document from a saved run artifact.

## Main-channel check

```bash
test -d /workspace/project && echo "MAIN" || echo "NOT_MAIN"
```

If `NOT_MAIN`, stop and explain that the run artifact is only available in the main workspace.

## Command

```bash
node /workspace/project/tools/nanocures-cli.mjs translational-handoff <run-file> --output <handoff-file>
```

Then review the generated markdown, add any missing caveats, and tell the user where it was saved.
