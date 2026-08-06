---
name: end-session
description: Tear down the current agent worktree after its PR merges — kill its processes, release its registry entry, remove the worktree and local branch, leaving the session archivable. Use when a worktree's work is merged (or abandoned) and the session is wrapping up.
---

# End session (worktree teardown)

Cleans up ALL local resources of an agent worktree so the session can be archived.
Remote branches and PR history are never touched.

## Preconditions (verify before acting)

1. The worktree's PR is MERGED (or the owner explicitly abandoned the work — then use `--force`).
2. Nothing uncommitted in the worktree that anyone wants (the script gates on this).
3. You are working from the MAIN checkout, NOT inside the worktree being removed —
   removing the worktree you occupy kills your own shell. If your session lives in that
   worktree, `cd` to the main checkout first and run everything from there.

## Procedure

One atomic command from the main checkout:

```sh
scripts/worktree-teardown.sh <worktree-name>
```

It kills processes on the worktree's registered port lane, releases the registry entry
(`.claude/worktrees/.registry.json`), removes the worktree, deletes the local branch
(merged-PR gate), and prunes. It then prints the OBSERVED end state — report that
observed state, not your intentions. If anything reports STILL PRESENT, investigate
before declaring the session clean.
