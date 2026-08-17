# Vendored lane registry (#45)

Replaced `scripts/worktree-registry.mjs` with a vendored reference implementation
(`scripts/lane-registry.py`) plus the conformance check that proves it meets the contract.

## Why, measured

A conformance run against the old registry found six behaviours it lacked — four measured,
two from reading the source:

- leases keyed by **directory basename**, not canonical worktree path, so a caller holding a
  path could not query and same-named worktrees collide
- **no `prune`**: a lease whose worktree is gone can never be released by its owner, so its
  lane is leased forever
- **no way to ask whether a worktree is claimed**, so tooling that deletes worktrees had
  nothing to consult
- **no lane ceiling**: allocation stepped upward without bound
- **no occupancy check** before allocating — an unleased block with a stray listener was
  handed out as free
- **`release` never refused**, even with live listeners, so a freed-but-occupied lane went to
  the next claimer

## Gotchas discovered while wiring it in

**The lane is an ordinal, not a port.** In the old registry `lane` *was* the port (4400). In
the new one it is 1, 2, 3… and ports are derived. `worktree-teardown.sh` computed
`lane + offset` to find processes to kill — which after the swap would have searched ports
1..10, killed nothing, and printed "ports: free". A silent success is worse than a failure.

Fixed upstream rather than locally: the registry now **reports the block** (`"block": [4400,
4409]`) in `claim`, `entry`, and `list`, so no caller re-derives it. Teardown reads the block.

**Teardown no longer forces the release.** It kills the block's processes first, so a refusal
from `release` means a process survived — a signal worth surfacing, not routing around. The
script's own `--force` is threaded through for the abandoned-work case.

**The docs drift gate did its job, then hit a rule it could not satisfy.** Deleting the `.mjs`
while `AGENTS.md` still referenced it fails check 1, which correctly forced the doc update. But
two *journal* entries also reference the path — and journals are append-only, never edited. So
the first deletion in this repo's life made check 1 permanently unsatisfiable: the only ways out
were editing history (forbidden) or an allowlist.

Added `RETIRED_ALLOW` to `scripts/lint-docs.sh` — paths that once existed and are now referenced
only by history. Narrow and explicit, one path listed, so a typo still fails. Worth knowing that
every future deletion needs an entry there; that is the cost of a gate that validates history.

**The schema lives at the primary checkout, and the branch introducing it cannot see it there.**
`lane-schema.json` is read from the primary so every worktree allocates against the same shape —
a per-worktree schema would hand out overlapping blocks. But that made the tooling unusable on
the very branch adopting it, and would do the same for any repo adopting it for the first time.
Resolved with a narrow fallback: primary first, then the invoking worktree, printing which it
used and that allocation is only consistent once the schema lands on the trunk.

**Migration of the live lease.** The old registry stored `lane: 4400` — the port itself. The new
one stores the ordinal, so `jeu-1` became lane 1 with block 4400-4409 derived. Converted in place
after taking a backup; verified by reading it back through the new implementation, and by
`claimed` answering 0 for `jeu-1` and non-zero for an unclaimed path.

## Trade-off, flagged not decided

The vendored implementation is Python 3 (stdlib only). This is a pnpm/moon repo, so it adds a
second language for one script. A node port is equally acceptable — the contract is about
behaviour, not language — but it becomes a reimplementation, which is what produced the six
defects above. Kept vendored; the conformance check is what makes either choice safe.
