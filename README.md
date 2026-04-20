# NanoCures

`NanoCures` is a NanoClaw-based disease-discovery workspace that mirrors the ClawCures feature set while leaning on NanoClaw's OS-level isolation, per-group sessions, sender allowlists, and explicit mount policy.

This fork was built against NanoClaw upstream commit `a81e165` dated 2026-04-18. The implementation choices here follow the current NanoClaw architecture, customization, scheduling, and security docs:

- https://github.com/qwibitai/nanoclaw
- https://docs.nanoclaw.dev/concepts/architecture
- https://docs.nanoclaw.dev/advanced/security-model
- https://docs.nanoclaw.dev/features/customization
- https://docs.nanoclaw.dev/features/scheduled-tasks
- https://docs.nanoclaw.dev/integrations/skills-system

## What It Adds

NanoCures keeps the ClawCures operating model, but exposes it as NanoClaw-native workflows:

- `ClawCures run` -> `/nanocures-run`
- `ClawCures run-autonomous` -> `/nanocures-autonomous`
- `ClawCures validate-plan` -> `/nanocures-validate-plan`
- `ClawCures rank-portfolio` -> `/nanocures-rank-portfolio`
- Translational handoff generation -> `/nanocures-translational-handoff`
- Regulatory evidence bundling -> `/nanocures-regulatory-bundle`
- Clinical trial registry helpers -> `/nanocures-clinical-trials`

Supporting assets live in:

- `templates/` for reproducible plan, run, portfolio, and trial JSON
- `tools/nanocures-cli.mjs` for deterministic validation, ranking, bundling, and registry operations
- `groups/main/CLAUDE.md` and `groups/global/CLAUDE.md` for NanoCures operating policy

## Security Model

NanoCures uses NanoClaw's security model directly instead of recreating app-level guardrails:

- Main-group agents get the project root read-only and only the required writable mounts.
- Additional mounts are validated against an external allowlist and are blocked entirely when that allowlist is absent.
- Non-main groups remain read-only for additional mounts via `nonMainReadOnly: true`.
- Sender allowlists stay outside the project root and should be enabled for any research group with more than one human participant.
- Remote Control is limited to the main group, requires an allowed sender, and stays bound to the initiating sender/chat until closed.
- Secrets stay out of containers; credentialed traffic is expected to flow through OneCLI Agent Vault.
- Public literature, approved non-PHI datasets, and generated artifacts should be mounted separately instead of broad home-directory mounts.

More detail is in [docs/NANOCURES_SECURITY.md](docs/NANOCURES_SECURITY.md) and [docs/FEATURE_MAPPING.md](docs/FEATURE_MAPPING.md).

## Quick Start

1. Install host dependencies.

```bash
npm install
npm run build
./container/build.sh
```

2. Set the default assistant identity.

```bash
export ASSISTANT_NAME=NanoCures
```

3. Configure NanoClaw as usual with `/setup`, then copy the example mount policy and tighten it for your workstation:

```bash
mkdir -p ~/.config/nanoclaw
cp config-examples/mount-allowlist.json ~/.config/nanoclaw/mount-allowlist.json
```

4. Use the NanoCures skills from the main control chat:

- `/nanocures-run`
- `/nanocures-autonomous`
- `/nanocures-validate-plan`
- `/nanocures-rank-portfolio`

## Suggested Workspace Layout

- `groups/main/campaigns/` for run artifacts and generated plans
- `groups/main/portfolios/` for portfolio inputs and ranked outputs
- `groups/main/trials/` for the clinical trial registry JSON
- `groups/global/` for cross-group evidence standards and mission memory

## Notes

- This fork deliberately keeps NanoClaw's small core and adds disease-discovery behavior through memory, skills, templates, and thin deterministic tooling.
- The helper CLI is designed for reproducible structure, not model inference. Claude Agent SDK inside NanoClaw remains the planner and analyst.
- Do not mount PHI, credentials, or unrestricted home directories into NanoCures containers.
