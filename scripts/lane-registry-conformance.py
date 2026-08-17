#!/usr/bin/env python3
"""conformance — does this lane registry meet the contract?

The contract, in full: *claim (idempotent, skipping occupied lanes), release
(refusing while listeners remain), prune (stale leases only), and `claimed
<path>` — keyed by the canonical worktree path, authoritative over its
resources.* It was written down long before anything verified it; this is that
verification.

Usage:
    conformance.py [--cmd "python3 /path/to/lane-registry.py"]
                   [--store <relative/path.sqlite|.json>]

`--store` picks the backend under test — the suffix decides SQLite or JSON.
Pass the one the floor runs in production, or the properties that differ
between backends (transactional allocation is a SQLite property) go untested
in exactly the setup that relies on them.

Builds a throwaway git repository with three worktrees in a temp directory and
drives the implementation through the contract there. It never touches a real
checkout: `release` and `prune` are destructive by nature and must be exercised
somewhere disposable.

Exercising claim is easy and every implementation does it. **Release and prune
are the halves that go unverified** — they only run at teardown, which is
exactly when nobody is watching.

An implementation whose CLI differs from the reference shape needs a small
adapter; the contract is about behaviour, not spelling.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REF = Path(__file__).with_name("lane-registry.py")

STORE_OVERRIDE: str | None = None

SCHEMA = {
    "base": 29000,
    "span": 10,
    "max_lanes": 4,
    "store": "local/lane-registry.json",
    "ports": {"dev": 0, "preview": 1},
    "marker": "local/lane",
}

# Three states, not two. A check that could not measure anything must never
# report PASS — that is how a non-conforming implementation looks partly fine.
# Unanswered is UNVERIFIED: never a pass and never a failure. A check that
# reports success when it measured nothing hides exactly what it was built to find.
results: list[tuple[str, str, str]] = []


def check(ok: bool, name: str, detail: str = ""):
    state = "PASS" if ok else "FAIL"
    results.append((state, name, detail))
    print(f"  {state}  {name}" + (f"  — {detail}" if detail else ""))


def unverified(name: str, detail: str = ""):
    results.append(("UNVERIFIED", name, detail))
    print(f"  UNVERIFIED  {name}" + (f"  — {detail}" if detail else ""))


def leases(cmd_prefix: list[str], cwd: Path) -> dict | None:
    """Every lease, asked of the implementation — never read from its store file.

    **The contract says nothing about storage format.** An earlier version of
    this check read the store as JSON, which passed against the reference
    implementation and then crashed against a SQLite one. A conformance check
    that inspects internals is testing a clone, not a contract.

    Returns None when the implementation cannot be asked (no `list`, or output
    this harness cannot parse) — which is UNVERIFIED, never FAIL.
    """
    p = subprocess.run([*cmd_prefix, "list", "--json"], cwd=cwd,
                       capture_output=True, text=True)
    if p.returncode != 0:
        return None
    try:
        rows = json.loads(p.stdout)
    except json.JSONDecodeError:
        return None
    if not isinstance(rows, list):
        return None
    return {r["worktree"]: r for r in rows if "worktree" in r and "lane" in r}


def supports(cmd_prefix: list[str], cwd: Path, verb: str) -> bool:
    """Does the implementation advertise this verb?

    Read from help output rather than by invoking the verb: invoking it with no
    arguments prints a usage message, which is indistinguishable from "unknown
    command" without parsing each implementation's phrasing.
    """
    blob = ""
    for probe in (["--help"], ["help"], []):
        p = subprocess.run([*cmd_prefix, *probe], cwd=cwd, capture_output=True, text=True)
        blob += (p.stdout + p.stderr).lower()
    return re.search(rf"\b{re.escape(verb)}\b", blob) is not None


def sh(cmd: list[str], cwd: Path, expect_ok: bool = True) -> subprocess.CompletedProcess:
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if expect_ok and p.returncode != 0:
        print(f"    ! {' '.join(cmd)}\n    ! rc={p.returncode} {p.stderr.strip()}")
    return p


def build_sandbox(root: Path) -> tuple[Path, list[Path]]:
    primary = root / "primary"
    primary.mkdir()
    sh(["git", "init", "-q", "-b", "main"], root)
    sh(["git", "init", "-q", "-b", "main"], primary)
    sh(["git", "config", "user.email", "conformance@example.invalid"], primary)
    sh(["git", "config", "user.name", "conformance"], primary)
    (primary / "README").write_text("sandbox\n")
    # --store picks the backend under test: the suffix decides SQLite vs JSON, and a floor
    # should be able to run conformance against the backend it actually runs in production.
    # Without this the flag parsed and did nothing, so every run drove the JSON store —
    # meaning the transactional-allocation property of the SQLite backend, the one most worth
    # verifying, was the one property never exercised (found in review of the first adopting project, 2026-08-17).
    schema = dict(SCHEMA, store=STORE_OVERRIDE) if STORE_OVERRIDE else SCHEMA
    (primary / "lane-schema.json").write_text(json.dumps(schema, indent=2))
    sh(["git", "add", "-A"], primary)
    sh(["git", "commit", "-qm", "init"], primary)

    worktrees = []
    for i in (1, 2, 3):
        wt = root / f"wt{i}"
        sh(["git", "worktree", "add", "-q", "-b", f"wt{i}", str(wt)], primary)
        worktrees.append(wt)
    return primary, worktrees


def run(cmd_prefix: list[str], root: Path):
    primary, (wt1, wt2, wt3) = build_sandbox(root)

    def reg(wt: Path, *args: str, expect_ok=True):
        return sh([*cmd_prefix, *args], wt, expect_ok)

    def lane_of(wt: Path):
        p = reg(wt, "entry")
        try:
            return json.loads(p.stdout)["lane"]
        except Exception:
            return None

    print("\ncontract: claim")
    reg(wt1, "claim")
    reg(wt2, "claim")
    l1, l2 = lane_of(wt1), lane_of(wt2)
    readable = l1 is not None and l2 is not None
    if not readable:
        unverified("claim records a lease per worktree",
                   "cannot read a lane back — this implementation's `entry` needs an "
                   "argument the harness does not know how to supply (adapter needed)")
        unverified("two worktrees never share a lane", "lanes unreadable")
        unverified("claim is idempotent for the same worktree", "lanes unreadable")
    else:
        check(True, "claim records a lease per worktree", f"wt1={l1} wt2={l2}")
        check(l1 != l2, "two worktrees never share a lane", f"{l1} vs {l2}")
        reg(wt1, "claim")
        check(lane_of(wt1) == l1, "claim is idempotent for the same worktree",
              f"still {lane_of(wt1)}")

    print("\ncontract: keyed by canonical worktree path")
    store = leases(cmd_prefix, wt1)
    if store is None:
        for clause in ("leases are keyed by absolute worktree path",
                       "this worktree's own path is the key",
                       "stored keys are canonical (symlinks resolved)"):
            unverified(clause, "implementation has no machine-readable `list` — the harness "
                               "cannot enumerate leases without inspecting internals")
        store = {}
    else:
        check(all(Path(k).is_absolute() for k in store),
              "leases are keyed by absolute worktree path",
              f"keys={[Path(k).name for k in store]}")
        check(str(wt1.resolve()) in store, "this worktree's own path is the key")
    # Callers hand the registry whatever path they hold. On macOS /var is a
    # symlink to /private/var, so an uncanonicalised path is the normal case,
    # not an edge one — and answering "not claimed" about a worktree that is in
    # use is exactly how prune tooling deletes something someone is working in.
        check(all(k == str(Path(k).resolve()) for k in store),
              "stored keys are canonical (symlinks resolved)")
    # This clause needs a non-canonical spelling of a claimed worktree. macOS hands the
    # sandbox one for free (/var -> /private/var); Linux does not, and `main` counts an
    # unverified clause as not-a-pass — so on every Linux runner the suite failed on this
    # one line, whatever the implementation did. Build the symlink instead of hoping the
    # platform supplied one: an unmeasurable clause is a harness defect, not a property.
    if not supports(cmd_prefix, wt1, "claimed"):
        unverified("claimed accepts a non-canonical path", "no claimed verb")
    else:
        spelling = wt1
        if str(spelling) == str(spelling.resolve()):
            alias = root / "alias"
            try:
                alias.symlink_to(root, target_is_directory=True)
                spelling = alias / wt1.name
            except OSError:
                pass
        if str(spelling) == str(spelling.resolve()):
            unverified("claimed accepts a non-canonical path",
                       "no symlink in the sandbox path and none could be created")
        else:
            p = reg(wt1, "claimed", str(spelling), expect_ok=False)
            check(p.returncode == 0,
                  "claimed accepts a non-canonical path for a claimed worktree",
                  f"{spelling} -> {spelling.resolve()}")

    print("\ncontract: derived values are reported, not re-derived by callers")
    if readable:
        e = json.loads(reg(wt1, "entry").stdout)
        blk = e.get("block")
        ok = (isinstance(blk, list) and len(blk) == 2
              and blk[0] == SCHEMA["base"] + SCHEMA["span"] * e["lane"]
              and blk[1] == blk[0] + SCHEMA["span"] - 1)
        check(ok, "entry reports the lane's port block", f"block={blk} lane={e['lane']}")
        check(all(p_ in range(blk[0], blk[1] + 1) for p_ in e.get("ports", {}).values()),
              "named ports fall inside the block", f"ports={e.get('ports')}")
    else:
        unverified("entry reports the lane's port block", "lanes unreadable")
        unverified("named ports fall inside the block", "lanes unreadable")

    print("\ncontract: release")
    listable = leases(cmd_prefix, wt1) is not None
    before = set(leases(cmd_prefix, wt1) or {})
    p_rel = reg(wt2, "release", expect_ok=False)
    after = set(leases(cmd_prefix, wt1) or {})
    if not listable:
        # Nothing to compare. A FAIL here would be an artifact of the harness.
        unverified("release drops the lease", "leases not enumerable")
        unverified("a released lane is reusable", "leases not enumerable")
        unverified("release removes the worktree's marker", "leases not enumerable")
    elif p_rel.returncode != 0 and before == after:
        unverified("release drops the lease",
                   f"release refused/errored and the store is unchanged: {p_rel.stderr.strip()[:70]}")
        unverified("a released lane is reusable", "nothing was released")
        unverified("release removes the worktree's marker", "nothing was released")
    else:
        check(before != after, "release drops the lease",
              f"{len(before)} -> {len(after)} leases")
        reg(wt3, "claim", expect_ok=False)
        if readable:
            check(lane_of(wt3) == l2, "a released lane is reusable", f"wt3 got {lane_of(wt3)}")
        else:
            unverified("a released lane is reusable", "lanes unreadable")
        check(not (wt2 / SCHEMA["marker"]).exists(), "release removes the worktree's marker")

    print("\ncontract: prune")
    l3 = lane_of(wt3)
    sh(["git", "worktree", "remove", "--force", str(wt3)], primary)
    check(not wt3.exists(), "sandbox: worktree directory removed", str(wt3.name))
    has_prune = supports(cmd_prefix, wt1, "prune")
    if not has_prune:
        check(False, "implementation has a prune command",
              "verb absent — stale leases accumulate and their lanes are never reclaimed")
        unverified("prune drops leases whose worktree is gone", "no prune verb")
        unverified("prune leaves live leases alone", "no prune verb")
    elif not listable:
        unverified("prune drops leases whose worktree is gone", "leases not enumerable")
        unverified("prune leaves live leases alone", "leases not enumerable")
    else:
        reg(wt1, "prune", expect_ok=False)
        store = leases(cmd_prefix, wt1) or {}
        check(str(wt3.resolve()) not in store, "prune drops leases whose worktree is gone")
        check(str(wt1.resolve()) in store, "prune leaves live leases alone")

    print("\ncontract: claimed (for tooling that deletes things)")
    if not supports(cmd_prefix, wt1, "claimed"):
        check(False, "implementation has a claimed command",
              "verb absent — deletion tooling has nothing to ask")
        unverified("claimed exits 0 for a live lease", "no claimed verb")
        unverified("claimed exits non-zero for an unclaimed path", "no claimed verb")
    else:
        p = reg(wt1, "claimed", str(wt1), expect_ok=False)
        check(p.returncode == 0, "claimed exits 0 for a live lease")
        p = reg(wt1, "claimed", str(wt3), expect_ok=False)
        check(p.returncode != 0, "claimed exits non-zero for an unclaimed path")

        # A moved worktree must never read as unclaimed. `git worktree move` re-homes a
        # directory without telling a path-keyed registry, so the lease stays under the old
        # path: the vanished path answers claimed and the live one answers not-claimed. That
        # inversion fails *open* — deletion tooling reads "no lease" as nothing to protect.
        # Claimed-or-unknown both pass; only a confident "not claimed" fails, because that is
        # the answer that gets a live worktree deleted (bought 2026-08-17 in the first adopting project's review).
        moved = wt2.parent / "wt2-moved"
        reg(wt2, "claim", expect_ok=False)
        mv = sh(["git", "worktree", "move", str(wt2), str(moved)], primary,
                expect_ok=False).returncode == 0
        if not mv:
            unverified("a moved worktree never reads as unclaimed", "git worktree move failed")
        else:
            p = reg(primary, "claimed", str(moved), expect_ok=False)
            check(p.returncode != 1,
                  "a moved worktree never reads as unclaimed",
                  f"exit {p.returncode}: {(p.stdout or p.stderr).strip().splitlines()[0][:80]}"
                  if (p.stdout or p.stderr).strip() else f"exit {p.returncode}")

            # ...and it must still hold once the orphan lease is gone. An implementation that
            # reconciles from the surviving orphan rather than from the moved directory's own
            # evidence passes the clause above and fails this one: `claim` prunes store-wide
            # before allocating, so any unrelated claim — any E2E run, any dev server, or the
            # prune tooling's own final `prune` — erases what the guard was reading. The
            # worktree then reads deletable again, which is the original incident one step
            # removed (bought in review round three of the first adopting project, 2026-08-17).
            reg(wt1, "claim", expect_ok=False)
            p = reg(primary, "claimed", str(moved), expect_ok=False)
            check(p.returncode != 1,
                  "a moved worktree still reads as in-use after its orphan lease is pruned",
                  f"exit {p.returncode}: {(p.stdout or p.stderr).strip().splitlines()[0][:80]}"
                  if (p.stdout or p.stderr).strip() else f"exit {p.returncode}")
            sh(["git", "worktree", "move", str(moved), str(wt2)], primary, expect_ok=False)

    print("\nexhaustion")
    for wt in (wt2,):
        reg(wt, "claim")
    # max_lanes is 4; wt1 and wt2 hold two. Claim the rest from temp worktrees.
    extra = []
    for i in (4, 5, 6):
        wt = root / f"wt{i}"
        sh(["git", "worktree", "add", "-q", "-b", f"wt{i}", str(wt)], primary)
        extra.append(wt)
        reg(wt, "claim", expect_ok=False)
    store = leases(cmd_prefix, wt1)
    if store is None:
        unverified("never allocates beyond max_lanes", "leases not enumerable")
        unverified("no duplicate lanes under pressure", "leases not enumerable")
    else:
        check(len(store) <= SCHEMA["max_lanes"],
              "never allocates beyond max_lanes",
              f"{len(store)} leases, max {SCHEMA['max_lanes']}")
        lanes = [e["lane"] for e in store.values()]
        check(len(lanes) == len(set(lanes)), "no duplicate lanes under pressure",
              f"{sorted(lanes)}")


def main():
    argv = sys.argv[1:]
    global STORE_OVERRIDE
    if "--store" in argv:
        STORE_OVERRIDE = argv[argv.index("--store") + 1]
    if "--cmd" in argv:
        prefix = argv[argv.index("--cmd") + 1].split()
    else:
        prefix = [sys.executable, str(REF)]
    print(f"lane-registry conformance\nimplementation: {' '.join(prefix)}")
    with tempfile.TemporaryDirectory(prefix="lane-conformance-") as tmp:
        run(prefix, Path(tmp))
    passed = sum(1 for st, _, _ in results if st == "PASS")
    failed = [r for r in results if r[0] == "FAIL"]
    unver = [r for r in results if r[0] == "UNVERIFIED"]
    print(f"\n{passed} passed · {len(failed)} failed · {len(unver)} unverified "
          f"(of {len(results)})")
    if failed:
        print("\nFailures — contract clauses this implementation does not meet:")
        for _, name, detail in failed:
            print(f"  - {name}" + (f"  ({detail})" if detail else ""))
    if unver:
        print("\nUnverified — the harness could not measure these, which is not a pass:")
        for _, name, detail in unver:
            print(f"  - {name}" + (f"  ({detail})" if detail else ""))
    sys.exit(0 if not failed and not unver else 1)


if __name__ == "__main__":
    main()
