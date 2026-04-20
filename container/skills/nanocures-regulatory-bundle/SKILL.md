---
name: nanocures-regulatory-bundle
description: Extract claims, evidence, risks, and references from a NanoCures run artifact into a bundle JSON. Main channel only.
---

# /nanocures-regulatory-bundle

Build a structured regulatory-style bundle from a run artifact.

## Main-channel check

```bash
test -d /workspace/project && echo "MAIN" || echo "NOT_MAIN"
```

If `NOT_MAIN`, stop and redirect the user to the main chat.

## Command

```bash
node /workspace/project/tools/nanocures-cli.mjs regulatory-bundle <run-file> --output <bundle-file>
```

After generating the bundle, sanity-check that claims and references are present before reporting completion.
