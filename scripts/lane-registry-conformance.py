#!/usr/bin/env python3
"""conformance — does this lane registry meet the contract?

The contract (`protocol/fleet.md` → "Registry and state"): *claim, release,
prune — keyed by worktree path — authoritative over its resources.* Pinned since
2026-08-15 and never verified against an implementation until this existed.

Usage:
    conformance.py [--cmd "python3 /path/to/lane-registry.py"]

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
# Same rule the fleet's comms diagnostic carries: unanswered is UNVERIFIED,
# never a pass and never a failure.
results: list[tuple[str, str, str]] = []


def check(ok: bool, name: str, detail: str = ""):
    state = "PASS" if ok else "FAIL"
    results.append((state, name, detail))
    print(f"  {state}  {name}" + (f"  — {detail}" if detail else ""))


def unverified(name: str, detail: str = ""):
    results.append(("UNVERIFIED", name, detail))
    print(f"  UNVERIFIED  {name}" + (f"  — {detail}" if detail else ""))


def read_store(primary: Path) -> dict:
    """The implementation's store, or {} if it is absent or unreadable.

    Never raises: an implementation that writes its store somewhere else, or not
    at all, is a finding to report — not a crash in the harness measuring it.
    """
    rel = STORE_OVERRIDE or SCHEMA["store"]
    try:
        return json.loads((primary / rel).read_text())
    except (FileNotFoundError, json.JSONDecodeError, NotADirectoryError):
        return {}


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
    (primary / "lane-schema.json").write_text(json.dumps(SCHEMA, indent=2))
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
    store = read_store(primary)
    if not store:
        check(False, "store is readable at the declared location",
              f"nothing at {STORE_OVERRIDE or SCHEMA['store']} — pass --store <relpath> "
              "if this implementation keeps its registry elsewhere")
    check(all(Path(k).is_absolute() for k in store),
          "leases are keyed by absolute worktree path",
          f"keys={[Path(k).name for k in store]}")
    check(str(wt1.resolve()) in store, "this worktree's own path is the key")
    # Callers hand the registry whatever path they hold. On macOS /var is a
    # symlink to /private/var, so an uncanonicalised path is the normal case,
    # not an edge one — and answering "not claimed" about a live bench is
    # exactly how prune tooling deletes something in use.
    check(all(k == str(Path(k).resolve()) for k in store),
          "stored keys are canonical (symlinks resolved)")
    if not supports(cmd_prefix, wt1, "claimed"):
        unverified("claimed accepts a non-canonical path", "no claimed verb")
    elif str(wt1) != str(wt1.resolve()):
        p = reg(wt1, "claimed", str(wt1), expect_ok=False)
        check(p.returncode == 0,
              "claimed accepts a non-canonical path for a claimed worktree",
              f"{wt1} -> {wt1.resolve()}")
    else:
        unverified("claimed non-canonical path", "no symlink in the sandbox path")

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
    before = set(read_store(primary))
    p_rel = reg(wt2, "release", expect_ok=False)
    after = set(read_store(primary))
    if p_rel.returncode != 0 and before == after:
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
    else:
        reg(wt1, "prune", expect_ok=False)
        store = read_store(primary)
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
    store = read_store(primary)
    check(len(store) <= SCHEMA["max_lanes"],
          "never allocates beyond max_lanes",
          f"{len(store)} leases, max {SCHEMA['max_lanes']}")
    lanes = [e["lane"] for e in store.values()]
    check(len(lanes) == len(set(lanes)), "no duplicate lanes under pressure", f"{sorted(lanes)}")


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
