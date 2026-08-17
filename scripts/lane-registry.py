#!/usr/bin/env python3
"""lane-registry — per-worktree resource lane allocation.

Vendored reference implementation. Copy this file into a project; the project
supplies a lane schema (lane-schema.json) and owns the apply step that turns a
lane into a working environment (.env writes, exports, database names).

Parallel worktrees collide when each stands up its own servers on the same
ports. This hands every worktree a *lane*: a disjoint block of ports derived
from one small integer, recorded in a store shared by all worktrees of the
repository.

Commands:
  claim [--json]              allocate (or return) this worktree's lane
  release [path] [--force]    drop a lease; refuses while listeners remain
  prune                       drop leases whose worktree directory is gone
  list [--json]               all leases with derived ports
  entry [path]                one lease as JSON
  ports [path]                named ports for a lease, as KEY=VALUE lines
  claimed <path>              exit 0 if that worktree holds a lease, 1 if not

`claimed` exists for tooling that deletes things — a prune scanner asks the
registry whether a worktree is in use rather than keeping its own protect-list.
Two sources of truth drift; this one is already authoritative.

Requires: python3, git. Uses lsof when present for occupancy checks; absence
degrades to "cannot see listeners" and is reported, never silently assumed free.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_NAME = "lane-schema.json"


def die(msg: str, code: int = 1):
    print(f"lane-registry: {msg}", file=sys.stderr)
    sys.exit(code)


def git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", *args], capture_output=True, text=True, check=True
        ).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        die("not inside a git repository (or git not on PATH)")


def roots() -> tuple[Path, Path]:
    """(this worktree's root, the primary checkout's root)."""
    worktree = Path(git("rev-parse", "--show-toplevel"))
    common = Path(git("rev-parse", "--path-format=absolute", "--git-common-dir"))
    return worktree, common.parent


def load_schema(primary: Path) -> dict:
    path = primary / SCHEMA_NAME
    if not path.exists():
        die(f"no {SCHEMA_NAME} at {primary} — the project must declare its lane schema")
    schema = json.loads(path.read_text())
    for key in ("base", "span", "max_lanes"):
        if key not in schema:
            die(f"{SCHEMA_NAME} is missing required key '{key}'")
    schema.setdefault("store", f"local/{SCHEMA_NAME.replace('schema', 'registry')}")
    schema.setdefault("ports", {})
    schema.setdefault("marker", None)
    return schema


def lane_base(schema: dict, lane: int) -> int:
    return schema["base"] + schema["span"] * lane


def derived_ports(schema: dict, lane: int) -> dict[str, int]:
    base = lane_base(schema, lane)
    return {name: base + off for name, off in schema["ports"].items()}


# ---------------------------------------------------------------- store + lock


class Store:
    def __init__(self, primary: Path, schema: dict):
        self.file = primary / schema["store"]
        self.lock = self.file.with_suffix(self.file.suffix + ".lock")
        self.file.parent.mkdir(parents=True, exist_ok=True)

    def __enter__(self):
        for attempt in range(200):
            try:
                self.lock.mkdir()
                break
            except FileExistsError:
                time.sleep(0.05)
        else:
            die(f"lock timeout — stale {self.lock}? remove it if no registry is running")
        self.data = self.read()
        return self

    def __exit__(self, *exc):
        self.lock.rmdir()
        return False

    def read(self) -> dict:
        try:
            return json.loads(self.file.read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def write(self):
        # Atomic: a reader never sees a half-written registry.
        tmp = self.file.with_suffix(self.file.suffix + ".tmp")
        tmp.write_text(json.dumps(self.data, indent=2, sort_keys=True) + "\n")
        tmp.replace(self.file)


# ------------------------------------------------------------------- occupancy


def listeners_in(low: int, high: int) -> tuple[list[tuple[str, int]], bool]:
    """(listeners in [low, high), whether we could actually look)."""
    if not shutil.which("lsof"):
        return [], False
    proc = subprocess.run(
        ["lsof", "-nP", "-iTCP", "-sTCP:LISTEN"], capture_output=True, text=True
    )
    found = []
    for line in proc.stdout.splitlines()[1:]:
        cols = line.split()
        if len(cols) < 9:
            continue
        m = re.search(r":(\d+)$", cols[8])
        if m and low <= int(m.group(1)) < high:
            found.append((cols[1], int(m.group(1))))
    return sorted(set(found)), True


def lane_is_busy(schema: dict, lane: int) -> tuple[bool, bool]:
    base = lane_base(schema, lane)
    found, could_look = listeners_in(base, base + schema["span"])
    return bool(found), could_look


# -------------------------------------------------------------------- commands


def cmd_claim(args, worktree: Path, primary: Path, schema: dict):
    key = str(worktree)
    branch = git("branch", "--show-current")
    with Store(primary, schema) as store:
        _prune(store, quiet=True)
        entry = store.data.get(key)
        if entry:
            # Existing lease: refresh metadata. Listeners in our own block are
            # ours, so no occupancy check here.
            entry["branch"] = branch
            entry["last_seen"] = now()
            store.write()
        else:
            taken = {e["lane"] for e in store.data.values()}
            lane = None
            for candidate in range(1, schema["max_lanes"] + 1):
                if candidate in taken:
                    continue
                busy, could_look = lane_is_busy(schema, candidate)
                if busy:
                    print(
                        f"lane-registry: lane {candidate} is unleased but occupied; skipping",
                        file=sys.stderr,
                    )
                    continue
                if not could_look:
                    print(
                        "lane-registry: lsof unavailable — allocating without an "
                        "occupancy check (a busy lane may be handed out)",
                        file=sys.stderr,
                    )
                lane = candidate
                break
            if lane is None:
                die(
                    f"no free lane in 1..{schema['max_lanes']} — run 'list', stop strays, "
                    "release or prune dead leases"
                )
            entry = {
                "lane": lane,
                "branch": branch,
                "claimed_at": now(),
                "last_seen": now(),
            }
            store.data[key] = entry
            store.write()

    if schema["marker"]:
        marker = worktree / schema["marker"]
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.write_text(f"{entry['lane']}\n")

    emit(args, {"worktree": key, **entry, "ports": derived_ports(schema, entry["lane"])})


def cmd_release(args, worktree: Path, primary: Path, schema: dict):
    force = "--force" in args
    positional = [a for a in args if not a.startswith("--")]
    target = str(Path(positional[0]).resolve()) if positional else str(worktree)

    with Store(primary, schema) as store:
        entry = store.data.get(target)
        if not entry:
            print(f"lane-registry: no lease for {target}", file=sys.stderr)
            return
        busy, could_look = lane_is_busy(schema, entry["lane"])
        if busy and not force:
            die(
                f"REFUSED release of lane {entry['lane']} for {target} — live listeners "
                "remain. Stop them, or rerun with --force."
            )
        if not could_look:
            print(
                "lane-registry: lsof unavailable — releasing without an occupancy check",
                file=sys.stderr,
            )
        # Invalidate the marker BEFORE dropping ownership: interrupted here we
        # leak a reservation (self-heals via prune/claim), never create two
        # apparent owners of one lane.
        if schema["marker"]:
            (Path(target) / schema["marker"]).unlink(missing_ok=True)
        del store.data[target]
        store.write()
    print(f"lane-registry: released lane {entry['lane']} for {target}", file=sys.stderr)


def _prune(store: Store, quiet: bool = False) -> list[str]:
    gone = [p for p in store.data if not Path(p).is_dir()]
    for path in gone:
        del store.data[path]
        if not quiet:
            print(f"lane-registry: pruned stale lease for {path}", file=sys.stderr)
    if gone:
        store.write()
    return gone


def cmd_prune(args, worktree: Path, primary: Path, schema: dict):
    with Store(primary, schema) as store:
        emit(args, {"pruned": _prune(store)})


def cmd_list(args, worktree: Path, primary: Path, schema: dict):
    store = Store(primary, schema)
    data = store.read()
    rows = [
        {"worktree": p, **e, "ports": derived_ports(schema, e["lane"]),
         "present": Path(p).is_dir()}
        for p, e in sorted(data.items(), key=lambda kv: kv[1]["lane"])
    ]
    if "--json" in args:
        print(json.dumps(rows, indent=2))
        return
    for r in rows:
        state = "present" if r["present"] else "STALE"
        print(f"{r['lane']:>4}  {lane_base(schema, r['lane']):>6}  {state:<8}  "
              f"{r.get('branch',''):<28}  {r['worktree']}")


def cmd_entry(args, worktree: Path, primary: Path, schema: dict):
    positional = [a for a in args if not a.startswith("--")]
    target = str(Path(positional[0]).resolve()) if positional else str(worktree)
    entry = Store(primary, schema).read().get(target)
    if not entry:
        die(f"no lease for {target}")
    print(json.dumps({"worktree": target, **entry,
                      "ports": derived_ports(schema, entry["lane"])}, indent=2))


def cmd_ports(args, worktree: Path, primary: Path, schema: dict):
    positional = [a for a in args if not a.startswith("--")]
    target = str(Path(positional[0]).resolve()) if positional else str(worktree)
    entry = Store(primary, schema).read().get(target)
    if not entry:
        die(f"no lease for {target} — claim first")
    for name, port in derived_ports(schema, entry["lane"]).items():
        print(f"{name}={port}")


def cmd_claimed(args, worktree: Path, primary: Path, schema: dict):
    """Exit 0 if the worktree holds a lease. For tooling that deletes things."""
    positional = [a for a in args if not a.startswith("--")]
    if not positional:
        die("usage: claimed <path>")
    target = str(Path(positional[0]).resolve())
    entry = Store(primary, schema).read().get(target)
    if entry:
        print(f"claimed lane {entry['lane']} ({entry.get('branch','')})")
        sys.exit(0)
    print("not claimed")
    sys.exit(1)


# ----------------------------------------------------------------------- shell


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def emit(args, payload: dict):
    print(json.dumps(payload, indent=2) if "--json" in args else summarize(payload))


def summarize(payload: dict) -> str:
    if "pruned" in payload:
        return f"pruned {len(payload['pruned'])} stale lease(s)"
    ports = " ".join(f"{k}={v}" for k, v in payload.get("ports", {}).items())
    return f"lane {payload['lane']}  {ports}".rstrip()


COMMANDS = {
    "claim": cmd_claim,
    "release": cmd_release,
    "prune": cmd_prune,
    "list": cmd_list,
    "entry": cmd_entry,
    "ports": cmd_ports,
    "claimed": cmd_claimed,
}


def main(argv: list[str]):
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__)
        return
    cmd, *args = argv
    if cmd not in COMMANDS:
        die(f"unknown command '{cmd}' — one of {', '.join(COMMANDS)}")
    worktree, primary = roots()
    COMMANDS[cmd](args, worktree, primary, load_schema(primary))


if __name__ == "__main__":
    main(sys.argv[1:])
