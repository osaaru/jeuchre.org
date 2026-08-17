#!/usr/bin/env python3
"""lane-registry — per-worktree resource lane allocation.

Vendored reference implementation. Copy this file into a project; the project
declares a lane schema (lane-schema.json) describing what a lane is made of.

Parallel worktrees collide when each stands up its own servers on the same
ports. This hands every worktree a *lane*: a disjoint block of ports (and
whatever else the schema derives from it) recorded in a store shared by all
worktrees of the repository.

Commands:
  claim [--json]              allocate (or return) this worktree's lane
  env                         export lines for an existing lease, for `eval`
  release [path] [--force]    drop a lease; refuses while listeners remain
  prune                       drop leases whose worktree directory is gone
  list [--json]               all leases, with health
  entry [path]                one lease as JSON
  ports [path]                named ports as KEY=VALUE lines
  claimed <path>              exit 0 claimed · 1 not claimed · 2 unknown

`claimed` exists for tooling that deletes things — a prune scanner asks the
registry whether a worktree is in use rather than keeping its own protect-list.
Two sources of truth drift; this one is already authoritative.

**stdout carries machine output; human summaries go to stderr**, so
`eval "$(lane-registry.py claim)"` is safe.

Requires python3 (stdlib only) and git. Uses lsof for occupancy checks; by
default it refuses to allocate when it cannot see listeners, because an
occupancy check that silently passes hands out lanes that cannot bind.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_NAME = "lane-schema.json"


def die(msg: str, code: int = 1):
    print(f"lane-registry: {msg}", file=sys.stderr)
    sys.exit(code)


def note(msg: str):
    print(f"lane-registry: {msg}", file=sys.stderr)


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", *args], capture_output=True, text=True, check=True
        ).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        die("not inside a git repository (or git not on PATH)")


def roots() -> tuple[Path, Path]:
    """(this worktree's root, the primary checkout's root)."""
    worktree = Path(git("rev-parse", "--show-toplevel")).resolve()
    common = Path(git("rev-parse", "--path-format=absolute", "--git-common-dir"))
    return worktree, common.parent.resolve()


# ----------------------------------------------------------------------- schema


def load_schema(primary: Path, worktree: Path | None = None,
                explicit: str | None = None) -> dict:
    """Schema from the primary checkout, falling back to the invoking worktree.

    The primary wins so every worktree allocates against the same shape — a
    per-worktree schema would hand out overlapping blocks. The fallback exists
    for one real case: the branch that *introduces* the schema cannot see it in
    the primary until it merges, which would otherwise make the tooling unusable
    exactly while it is being adopted.
    """
    # An explicit --schema (or LANE_SCHEMA) lets a caller point at a schema
    # outside the checkout it is operating on — needed by compatibility shims
    # and by test fixtures, which are throwaway repos with no schema of their own.
    explicit = explicit or os.environ.get("LANE_SCHEMA")
    if explicit:
        path = Path(explicit).expanduser().resolve()
        if not path.exists():
            die(f"--schema {path} does not exist")
        schema = json.loads(path.read_text())
        return _defaults(schema)
    path = primary / SCHEMA_NAME
    if not path.exists() and worktree is not None and (worktree / SCHEMA_NAME).exists():
        path = worktree / SCHEMA_NAME
        note(f"no {SCHEMA_NAME} in the primary checkout; using this worktree's copy. "
             "Allocation is only consistent once it lands on the trunk.")
    if not path.exists():
        die(f"no {SCHEMA_NAME} at {primary} — the project must declare its lane schema")
    return _defaults(json.loads(path.read_text()))


def _defaults(schema: dict) -> dict:
    for key in ("base", "span", "max_lanes"):
        if key not in schema:
            die(f"{SCHEMA_NAME} is missing required key '{key}'")
    schema.setdefault("store", "local/lane-registry.sqlite")
    schema.setdefault("ports", {})       # name -> offset from the block base
    schema.setdefault("derived", {})     # name -> {"multiply": N} | {"offset": N}
    schema.setdefault("marker", None)    # per-worktree file holding the lane number
    schema.setdefault("env_prefix", "LANE_")
    schema.setdefault("env_lane_name", "LANE")
    schema.setdefault("env_base_name", "BASE")
    schema.setdefault("env_extra", {})   # NAME -> "template with {port_name}"
    schema.setdefault("require_occupancy_check", True)
    return schema


def lane_base(schema: dict, lane: int) -> int:
    return schema["base"] + schema["span"] * lane


def lane_block(schema: dict, lane: int) -> list[int]:
    """[first, last] port of the lane's block, reported so callers never re-derive it.

    A caller that assumes the lane *number* is a port number is a silent failure:
    teardown tooling once looked for processes on ports 1..10 instead of
    4400..4409, killed nothing, and reported "ports: free".
    """
    base = lane_base(schema, lane)
    return [base, base + schema["span"] - 1]


def derived_ports(schema: dict, lane: int) -> dict[str, int]:
    base = lane_base(schema, lane)
    return {name: base + off for name, off in schema["ports"].items()}


def derived_values(schema: dict, lane: int) -> dict[str, int]:
    """Non-port integers a floor derives from its lane — DB indexes, sublanes."""
    base = lane_base(schema, lane)
    out = {}
    for name, spec in schema["derived"].items():
        if "multiply" in spec:
            out[name] = lane * spec["multiply"]
        elif "offset" in spec:
            out[name] = base + spec["offset"]
        else:
            die(f"derived '{name}' needs 'multiply' or 'offset'")
    return out


def full(schema: dict, key: str, entry: dict) -> dict:
    return {"worktree": key, **entry,
            "block": lane_block(schema, entry["lane"]),
            "ports": derived_ports(schema, entry["lane"]),
            "derived": derived_values(schema, entry["lane"])}


# ------------------------------------------------------------------------ store
#
# The contract says nothing about storage format. Two backends ship, chosen by
# the store's suffix: SQLite for floors with real concurrency (transactional
# allocation — a racing claimer collides on UNIQUE and re-reads, and a process
# that dies mid-claim cannot wedge anything), JSON for floors that want a
# readable file. The JSON backend's lock is advisory and a crashed holder must
# be cleared by hand; that is the trade.


class SqliteStore:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(path), timeout=5.0, isolation_level=None)
        self.db.execute("""CREATE TABLE IF NOT EXISTS leases (
                             worktree   TEXT PRIMARY KEY,
                             lane       INTEGER NOT NULL UNIQUE,
                             branch     TEXT,
                             claimed_at TEXT NOT NULL,
                             last_seen  TEXT NOT NULL)""")

    def all(self) -> dict[str, dict]:
        rows = self.db.execute(
            "SELECT worktree, lane, branch, claimed_at, last_seen FROM leases").fetchall()
        return {r[0]: {"lane": r[1], "branch": r[2], "claimed_at": r[3],
                       "last_seen": r[4]} for r in rows}

    def get(self, key: str):
        return self.all().get(key)

    def insert(self, key: str, entry: dict) -> bool:
        """True if inserted; False on a UNIQUE collision (another claimer won)."""
        try:
            self.db.execute("INSERT INTO leases VALUES (?,?,?,?,?)",
                            (key, entry["lane"], entry["branch"],
                             entry["claimed_at"], entry["last_seen"]))
            return True
        except sqlite3.IntegrityError:
            return False

    def touch(self, key: str, branch: str):
        self.db.execute("UPDATE leases SET branch=?, last_seen=? WHERE worktree=?",
                        (branch, now(), key))

    def delete(self, key: str):
        self.db.execute("DELETE FROM leases WHERE worktree=?", (key,))


class JsonStore:
    def __init__(self, path: Path):
        self.path = path
        self.lock = path.with_suffix(path.suffix + ".lock")
        path.parent.mkdir(parents=True, exist_ok=True)

    def _lock(self):
        for _ in range(200):
            try:
                self.lock.mkdir()
                return
            except FileExistsError:
                time.sleep(0.05)
        die(f"lock timeout — stale {self.lock}? remove it if no registry is running")

    def _unlock(self):
        try:
            self.lock.rmdir()
        except FileNotFoundError:
            pass

    def all(self) -> dict[str, dict]:
        try:
            return json.loads(self.path.read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def get(self, key: str):
        return self.all().get(key)

    def _write(self, data: dict):
        tmp = self.path.with_suffix(self.path.suffix + ".tmp")
        tmp.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")
        tmp.replace(self.path)

    def insert(self, key: str, entry: dict) -> bool:
        self._lock()
        try:
            data = self.all()
            if any(e["lane"] == entry["lane"] for e in data.values()):
                return False
            data[key] = entry
            self._write(data)
            return True
        finally:
            self._unlock()

    def touch(self, key: str, branch: str):
        self._lock()
        try:
            data = self.all()
            if key in data:
                data[key].update(branch=branch, last_seen=now())
                self._write(data)
        finally:
            self._unlock()

    def delete(self, key: str):
        self._lock()
        try:
            data = self.all()
            data.pop(key, None)
            self._write(data)
        finally:
            self._unlock()


def open_store(primary: Path, schema: dict):
    path = primary / schema["store"]
    return (SqliteStore(path) if path.suffix in (".sqlite", ".sqlite3", ".db")
            else JsonStore(path))


# ------------------------------------------------------------------- occupancy


def listeners_in(low: int, high: int) -> tuple[list, bool]:
    """(listeners in [low, high], whether we could actually look)."""
    if not shutil.which("lsof"):
        return [], False
    proc = subprocess.run(["lsof", "-nP", "-iTCP", "-sTCP:LISTEN"],
                          capture_output=True, text=True)
    found = []
    for line in proc.stdout.splitlines()[1:]:
        cols = line.split()
        if len(cols) < 9:
            continue
        m = re.search(r":(\d+)$", cols[8])
        if m and low <= int(m.group(1)) <= high:
            found.append((cols[1], int(m.group(1))))
    return sorted(set(found)), True


def lane_busy(schema: dict, lane: int) -> tuple[list, bool]:
    lo, hi = lane_block(schema, lane)
    return listeners_in(lo, hi)


def require_visibility(schema: dict, could_look: bool, action: str):
    """Refuse to act blind unless the floor opted out.

    Without lsof the occupancy check silently passes and lanes claim as empty —
    and a lane handed out that way cannot bind. Failing loudly is a rule
    learned from a predecessor registry and adopted here.
    """
    if could_look:
        return
    if schema["require_occupancy_check"]:
        die("cannot see listeners (lsof not on PATH) and this schema requires an "
            f"occupancy check before {action}. Install lsof, or set "
            '"require_occupancy_check": false for this floor.')
    note(f"lsof unavailable — {action} without an occupancy check")


# -------------------------------------------------------------------- commands


def print_env(schema: dict, p: dict):
    """Export lines on stdout, so `eval "$(lane-registry.py claim)"` works."""
    pre = schema["env_prefix"]
    values = {**p["ports"], **p["derived"]}
    print(f"export {pre}{schema['env_lane_name']}={p['lane']}")
    print(f"export {pre}{schema['env_base_name']}={p['block'][0]}")
    for name, value in values.items():
        print(f"export {pre}{name.upper()}={value}")
    for name, template in schema["env_extra"].items():
        print(f"export {pre}{name.upper()}={template.format(**values)}")


def summarize(p: dict):
    lo, hi = p["block"]
    note(f"lane {p['lane']} -> ports {lo}-{hi} for {p['worktree']}")
    for group in ("ports", "derived"):
        if p[group]:
            note("  " + "  ".join(f"{k}={v}" for k, v in p[group].items()))


def cmd_claim(args, worktree: Path, primary: Path, schema: dict):
    key, branch = str(worktree), git("branch", "--show-current")
    store = open_store(primary, schema)
    _prune(store, quiet=True)

    entry = store.get(key)
    if entry:
        # Listeners in our own block are ours; no occupancy check on re-claim.
        store.touch(key, branch)
        entry = store.get(key)
    else:
        taken = {e["lane"] for e in store.all().values()}
        for candidate in range(1, schema["max_lanes"] + 1):
            if candidate in taken:
                continue
            busy, could_look = lane_busy(schema, candidate)
            require_visibility(schema, could_look, "allocating")
            if busy:
                note(f"lane {candidate} is unleased but occupied "
                     f"(pid/port {busy[:2]}); skipping")
                continue
            cand = {"lane": candidate, "branch": branch,
                    "claimed_at": now(), "last_seen": now()}
            if store.insert(key, cand):
                entry = cand
                break
            # UNIQUE collision: a concurrent claimer took this lane, or our own
            # row already exists. Re-read before advancing.
            entry = store.get(key)
            if entry:
                break
        if not entry:
            die(f"no free lane in 1..{schema['max_lanes']} — run 'list', stop strays, "
                "release or prune dead leases")

    if schema["marker"]:
        marker = worktree / schema["marker"]
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.write_text(f"{entry['lane']}\n")

    payload = full(schema, key, entry)
    if "--json" in args:
        print(json.dumps(payload, indent=2))
    else:
        summarize(payload)
        print_env(schema, payload)


def cmd_env(args, worktree: Path, primary: Path, schema: dict):
    entry = open_store(primary, schema).get(str(worktree))
    if not entry:
        die(f"no lease for {worktree} — run 'claim' first")
    print_env(schema, full(schema, str(worktree), entry))


def cmd_release(args, worktree: Path, primary: Path, schema: dict):
    force = "--force" in args
    pos = [a for a in args if not a.startswith("--")]
    target = str(Path(pos[0]).resolve()) if pos else str(worktree)
    store = open_store(primary, schema)
    entry = store.get(target)
    if not entry:
        # No lease, but a marker may survive one: prune drops a lease while the directory
        # lives, or a release lands against a different spelling of the path. Tooling that
        # reads the marker (E2E port derivation) would then bind a block the registry has
        # since handed to someone else. `claim` self-heals by rewriting it; release must
        # clear it, which the shell implementation did and this one had stopped doing.
        if schema["marker"]:
            (Path(target) / schema["marker"]).unlink(missing_ok=True)
        note(f"no lease for {target} (nothing to release; cleared any stale marker)")
        return
    busy, could_look = lane_busy(schema, entry["lane"])
    if busy and not force:
        die(f"REFUSED release of lane {entry['lane']} for {target} — live listeners "
            f"remain (pid/port {busy[:3]}). Stop them, or rerun with --force.")
    if not force:
        require_visibility(schema, could_look, "releasing")
    # Invalidate the marker BEFORE dropping ownership: interrupted here we leak a
    # reservation (self-heals via prune/claim), never create two apparent owners.
    if schema["marker"]:
        (Path(target) / schema["marker"]).unlink(missing_ok=True)
    store.delete(target)
    note(f"released lane {entry['lane']} for {target}")


def _prune(store, quiet: bool = False) -> list[str]:
    gone = [p for p in store.all() if not Path(p).is_dir()]
    for path in gone:
        store.delete(path)
        if not quiet:
            note(f"pruned stale lease for {path}")
    return gone


def cmd_prune(args, worktree: Path, primary: Path, schema: dict):
    pruned = _prune(open_store(primary, schema))
    print(json.dumps({"pruned": pruned}, indent=2) if "--json" in args
          else f"pruned {len(pruned)} stale lease(s)")


def cmd_list(args, worktree: Path, primary: Path, schema: dict):
    store = open_store(primary, schema)
    rows = []
    for key, e in sorted(store.all().items(), key=lambda kv: kv[1]["lane"]):
        present = Path(key).is_dir()
        busy, could_look = lane_busy(schema, e["lane"])
        state = ("STALE" if not present else "active" if busy
                 else "idle" if could_look else "idle?")
        rows.append({**full(schema, key, e), "present": present, "state": state})
    if "--json" in args:
        print(json.dumps(rows, indent=2))
        return
    print(f"{'lane':>5} {'block':>13}  {'state':<7} {'branch':<30} worktree")
    for r in rows:
        print(f"{r['lane']:>5} {r['block'][0]:>6}-{r['block'][1]:<6} {r['state']:<7} "
              f"{(r.get('branch') or ''):<30} {r['worktree']}")


def cmd_entry(args, worktree: Path, primary: Path, schema: dict):
    pos = [a for a in args if not a.startswith("--")]
    target = str(Path(pos[0]).resolve()) if pos else str(worktree)
    entry = open_store(primary, schema).get(target)
    if not entry:
        die(f"no lease for {target}")
    print(json.dumps(full(schema, target, entry), indent=2))


def cmd_ports(args, worktree: Path, primary: Path, schema: dict):
    pos = [a for a in args if not a.startswith("--")]
    target = str(Path(pos[0]).resolve()) if pos else str(worktree)
    entry = open_store(primary, schema).get(target)
    if not entry:
        die(f"no lease for {target} — claim first")
    p = full(schema, target, entry)
    for name, value in {**p["ports"], **p["derived"]}.items():
        print(f"{name}={value}")


def cmd_claimed(args, worktree: Path, primary: Path, schema: dict):
    """Exit 0 claimed · 1 not claimed · 2 unknown. For tooling that deletes things.

    **Three answers, because "no lease under this path" is not "no lease".** `git worktree
    move` re-homes a directory without telling the registry, so the lease stays keyed to a
    path that no longer exists: the vanished path answers claimed and the live worktree
    answers not-claimed — inverted, in the direction that hands a live worktree to deletion
    tooling as safe. Found in review 2026-08-17 after a worktree rename did exactly that, and
    reproduced deterministically with `git worktree move`.

    Reconciliation, when the target has no lease of its own — driven by the **marker**, not by
    the surviving orphan lease. Only `release` removes a marker; `prune` and `claim` do not. So
    a directory that still carries one has claimed at some point and has not released, and that
    is true however the store has since been swept:

    - Marker names a lane **no lease holds** — the lease was pruned out from under a live
      directory (any `claim` anywhere prunes store-wide, as does `prune`). **Claimed.**
    - Marker names a lane leased to a path that **no longer exists** — the orphan is still
      there and corroborates the move. **Claimed.**
    - Marker names a lane leased to a **live** path — the lane was re-allocated after the
      holder moved, or this directory is a copy of one that claimed. Indistinguishable from
      here, so **unknown**, which callers treat as "leave it alone".
    - **No marker**, but orphan leases exist — a moved holder whose marker is missing and a
      worktree that never claimed look the same. **Unknown.**
    - No marker, no orphans — **not claimed.**

    A readable marker therefore never yields "not claimed". That is the property deletion
    tooling depends on: only the answer that gets a live worktree deleted is gated on evidence
    that no other verb erases. Keying the reconciliation on the orphan lease instead made the
    guard fire exactly once, until the next `claim` anywhere in the repo swept the orphan and
    the moved worktree went back to reading deletable with its marker sitting unread (found in
    review round three of the first adopting project, 2026-08-17).

    This answers; it does not re-key. A query verb that silently rewrites the store is a worse
    surprise than a stale key, and deletion tooling is the last caller that should have side
    effects. `claim` re-keys, and prunes the orphan while it is there.
    """
    pos = [a for a in args if not a.startswith("--")]
    if not pos:
        die("usage: claimed <path>")
    target = str(Path(pos[0]).resolve())
    store = open_store(primary, schema)
    entry = store.get(target)
    if entry:
        print(f"claimed lane {entry['lane']} ({entry.get('branch') or ''})".rstrip())
        sys.exit(0)

    lane = None
    if schema["marker"]:
        try:
            lane = int((Path(target) / schema["marker"]).read_text().strip())
        except (OSError, ValueError):
            lane = None

    if lane is not None:
        holder = next((p for p, e in store.all().items() if e["lane"] == lane), None)
        if holder is None:
            print(f"claimed lane {lane} — no lease under this path and none holding that "
                  "lane, but this worktree still carries the marker, which only 'release' "
                  "clears: its lease was pruned while it lived on. Run 'claim' to re-key it.")
            sys.exit(0)
        if not Path(holder).is_dir():
            print(f"claimed lane {lane} — lease is keyed to {holder}, which no longer "
                  "exists, and this worktree carries that lane's marker: it was moved. "
                  "Run 'claim' here to re-key it.")
            sys.exit(0)
        print(f"unknown — this worktree carries a marker for lane {lane}, but that lane is "
              f"leased to {holder}, which is live. A moved holder whose lane was re-allocated "
              "and a copy of a worktree that claimed look the same from here. Treat this as "
              "in-use, and run 'claim' to settle it.")
        sys.exit(2)

    # `is_dir`, matching `_prune`'s definition of a stale lease, so the two verbs never
    # disagree about which leases are orphans.
    orphans = {p: e for p, e in store.all().items() if not Path(p).is_dir()}
    if orphans:
        print(f"unknown — no lease for this path, but {len(orphans)} lease(s) are keyed to "
              "paths that no longer exist, so a moved worktree cannot be told from one that "
              "never claimed. Run 'prune' and 'claim', and treat this as in-use meanwhile.")
        sys.exit(2)

    print("not claimed")
    sys.exit(1)


COMMANDS = {
    "claim": cmd_claim, "env": cmd_env, "release": cmd_release, "prune": cmd_prune,
    "list": cmd_list, "entry": cmd_entry, "ports": cmd_ports, "claimed": cmd_claimed,
}


def main(argv: list[str]):
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__)
        return
    explicit = None
    if "--schema" in argv:
        i = argv.index("--schema")
        explicit = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    cmd, *args = argv
    if cmd not in COMMANDS:
        die(f"unknown command '{cmd}' — one of {', '.join(COMMANDS)}")
    worktree, primary = roots()
    COMMANDS[cmd](args, worktree, primary, load_schema(primary, worktree, explicit))


if __name__ == "__main__":
    main(sys.argv[1:])
