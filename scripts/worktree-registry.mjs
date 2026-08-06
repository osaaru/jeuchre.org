#!/usr/bin/env node
/**
 * Shared worktree registry: which worktrees exist, their branches, and their
 * claimed port lanes. Stored in the MAIN checkout at .claude/worktrees/.registry.json
 * so every worktree sees the same state. See AGENTS.md "Worktrees".
 *
 *   claim   [--issue N] [--quiet]   register cwd's worktree; assign lowest free lane
 *   release <name>                  remove an entry
 *   entry   <name>                  print one entry as JSON
 *   list                            print all entries as JSON
 *   port    <name> <dev|preview|e2e>  print a single port number
 *
 * Lanes start at 4400 in steps of 10 (operator owns 4321):
 * dev = lane, preview = lane+1, e2e = lane+2.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LANE_BASE = 4400;
const LANE_STEP = 10;

const commonDir = execSync("git rev-parse --git-common-dir", { encoding: "utf8" }).trim();
const mainRoot = path.dirname(path.resolve(commonDir));
const regDir = path.join(mainRoot, ".claude", "worktrees");
const regFile = path.join(regDir, ".registry.json");
const lockDir = path.join(regDir, ".registry.lock");

function withLock(fn) {
  fs.mkdirSync(regDir, { recursive: true });
  for (let tries = 0; ; tries++) {
    try {
      fs.mkdirSync(lockDir);
      break;
    } catch {
      if (tries > 100) throw new Error("registry lock timeout (stale .registry.lock?)");
      execSync("sleep 0.05");
    }
  }
  try {
    return fn();
  } finally {
    fs.rmdirSync(lockDir);
  }
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(regFile, "utf8"));
  } catch {
    return {};
  }
}

function save(reg) {
  fs.writeFileSync(regFile, `${JSON.stringify(reg, null, 2)}\n`);
}

function ports(lane) {
  return { dev: lane, preview: lane + 1, e2e: lane + 2 };
}

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "claim": {
    const cwd = process.cwd();
    const name = path.basename(cwd);
    const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
    const issueFlag = args.indexOf("--issue");
    const issue = issueFlag >= 0 ? Number(args[issueFlag + 1]) : Number(name.split("-")[0]) || null;
    const entry = withLock(() => {
      const reg = load();
      if (reg[name]) {
        reg[name] = { ...reg[name], path: cwd, branch, claimedAt: reg[name].claimedAt };
        save(reg);
        return reg[name];
      }
      const used = new Set(Object.values(reg).map((e) => e.lane));
      let lane = LANE_BASE;
      while (used.has(lane)) lane += LANE_STEP;
      reg[name] = { path: cwd, branch, issue, lane, claimedAt: new Date().toISOString() };
      save(reg);
      return reg[name];
    });
    const p = ports(entry.lane);
    if (args.includes("--quiet")) {
      console.log(`Port lane ${entry.lane}: dev=${p.dev} preview=${p.preview} e2e=${p.e2e}`);
    } else {
      console.log(JSON.stringify({ name, ...entry, ports: p }, null, 2));
    }
    break;
  }
  case "release": {
    const name = args[0];
    if (!name) throw new Error("usage: release <name>");
    withLock(() => {
      const reg = load();
      delete reg[name];
      save(reg);
    });
    console.log(`released ${name}`);
    break;
  }
  case "entry": {
    const reg = load();
    const e = reg[args[0]];
    if (!e) {
      console.error(`no entry: ${args[0]}`);
      process.exit(1);
    }
    console.log(JSON.stringify({ name: args[0], ...e, ports: ports(e.lane) }));
    break;
  }
  case "list": {
    const reg = load();
    console.log(
      JSON.stringify(
        Object.entries(reg).map(([name, e]) => ({ name, ...e, ports: ports(e.lane) })),
        null,
        2,
      ),
    );
    break;
  }
  case "port": {
    const reg = load();
    const e = reg[args[0]];
    const role = args[1];
    if (!e || !["dev", "preview", "e2e"].includes(role)) {
      console.error("usage: port <name> <dev|preview|e2e>");
      process.exit(1);
    }
    console.log(ports(e.lane)[role]);
    break;
  }
  default:
    console.error("usage: worktree-registry.mjs <claim|release|entry|list|port> ...");
    process.exit(1);
}
