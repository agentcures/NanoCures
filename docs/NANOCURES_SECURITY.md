# NanoCures Security Profile

NanoCures is opinionated about how NanoClaw's security features should be used for biomedical work.

## Recommended Boundary Design

- Keep the main control group as the only place that can register groups or request broad campaign work.
- Mount the project root read-only, which NanoClaw already does for the main group.
- Mount approved literature and non-PHI datasets explicitly through the external allowlist.
- Keep additional mounts read-only unless the task truly needs write access.
- Store generated campaign artifacts in the group workspace, not in mounted source repositories.

## Approved Data Classes

- public papers
- regulator publications
- public trial records
- approved non-PHI datasets
- generated summaries, JSON plans, and handoff documents

## Prohibited Data Classes

- PHI
- patient-level exports
- credential files
- raw `.env` files
- SSH, cloud, kube, or package-manager secrets
- broad mounts like `~`, `/`, or unrelated source trees

## Sender Controls

For any multi-user research chat, configure `~/.config/nanoclaw/sender-allowlist.json` so only approved operators can trigger the agent. Trigger mode is usually the safest default because it preserves context while blocking execution by unapproved senders.

Remote Control commands are stricter than normal chat traffic: they are accepted only in the main group, require an allowed sender, and stay scoped to the sender/chat that started the session.

## Additional Mount Policy

The example allowlist in `config-examples/mount-allowlist.json` is intentionally narrow:

- `~/research/public-literature` as read-only
- `~/research/datasets/nonphi` as read-only
- `~/research/workspaces/nanocures` as the only writable analysis root

If a user asks for a broader mount, challenge it. The default answer should be no unless the narrower alternative is genuinely insufficient.
