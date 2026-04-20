---
name: nanocures-clinical-trials
description: Manage the NanoCures local clinical trial registry JSON. Main channel only.
---

# /nanocures-clinical-trials

Manage the local trial ledger at `/workspace/group/trials/clinical-trials.json`.

## Main-channel check

```bash
test -d /workspace/project && echo "MAIN" || echo "NOT_MAIN"
```

If `NOT_MAIN`, stop and explain that the registry is maintained from the main chat.

## Commands

List:

```bash
node /workspace/project/tools/nanocures-cli.mjs trials-list --store /workspace/group/trials/clinical-trials.json
```

Add:

```bash
node /workspace/project/tools/nanocures-cli.mjs trials-add \
  --store /workspace/group/trials/clinical-trials.json \
  --trial-id NCT00000000 \
  --title "Example study" \
  --phase "Phase II" \
  --indication "oncology" \
  --status recruiting
```

Update:

```bash
node /workspace/project/tools/nanocures-cli.mjs trials-update \
  --store /workspace/group/trials/clinical-trials.json \
  --trial-id NCT00000000 \
  --status completed
```

When the user asks about current trial status, verify externally before updating the ledger.
