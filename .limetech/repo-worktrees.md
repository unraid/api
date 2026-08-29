# Repository worktree guidance

Shared worktree procedure:

- Read and follow the Limetech repo worktree skill before creating or choosing a worktree.
- Use a separate task checkout for implementation work.
- Claim the task checkout lease before editing it.

Repo-local facts:

- Repo slug: `unraid/api`
- Worktree root: `..`
- Canonical base checkout: `../../api`
- Current task worktree: `connect-tunnel-local`
- Default branch source: `origin/main`
- Push remote: `origin`
- Lanes: `api`, `packages`, `plugin`, `unraid-ui`, `web`, and shared tooling
- Initialization: `pnpm install --frozen-lockfile`
- Readiness: `pnpm --version` and `node --version`
- Verification: `pnpm lint`, `pnpm type-check`, and `pnpm test`
- Protected paths: release files, generated files, and unrelated packages

This workspace uses separate repository clones under `api-worktrees/` instead
of Git-registered worktrees from the canonical checkout. Keep the canonical
checkout unchanged when it contains active work. Do not move or switch an
existing task checkout without explicit coordination.
