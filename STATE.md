# STATE.md — project ledger

The handoff ledger for jeuchre.org. Any agent (or human) starting work reads, in order:
[PLAN.md](PLAN.md) (decisions/architecture) → [AGENTS.md](AGENTS.md) (how to work) → this
file (where things stand) → the newest few entries in [journal/](journal/) (what it cost us
to learn). **Every PR adds one dated journal file** — `journal/YYYY-MM-DD-<slug>.md` — and
never edits existing entries. The Snapshot below is refreshed only when it is wrong
(typically by the session that merges or kicks off work), NOT by every PR — separate
journal files are what let concurrent PRs merge without ledger conflicts (#31).

## Snapshot

- **Phase:** 1 (site relaunch) — in progress
- **Work queue:** the [board](https://github.com/orgs/osaaru/projects/1) is canonical
  (Backlog → Ready → In progress → Needs review → Done, driven by the PR lifecycle).
- **Blocked on owner:** Cloudflare account + API token (#8/#10). Everything else is
  board-visible via `proposal` / `owner-task` labels.

## Journal

One file per PR in [journal/](journal/), named `YYYY-MM-DD-<slug>.md`, newest last by sort.
Record what changed, why, and gotchas discovered — cross-cutting lessons the next agent
should never rediscover. Entries are append-only history: never rewrite them.
