#!/usr/bin/env node
/**
 * Stops any dev server left running for this project.
 *
 *   npm run stop
 *
 * A server that didn't shut down cleanly keeps holding its port, and because
 * `npm run dev` runs the three apps under `concurrently -k`, one "port already
 * in use" failure takes the whole stack down with it.
 *
 * Killing the process that holds the port is not enough on its own: ts-node-dev
 * and vite run the real server as a *child* and respawn it the moment it dies.
 * So this walks up from the listener to its supervisor and kills the whole
 * tree, and separately sweeps any dev-server process whose command line points
 * at this repo.
 *
 * Only processes belonging to this project are touched — a Node app you have
 * running elsewhere is left alone.
 */
const { execSync } = require("child_process");
const path = require("path");

const PORTS = [
  { port: 3000, name: "frontend" },
  { port: 5000, name: "backend" },
  { port: 5173, name: "admin" },
];

/** Command-line signatures of the dev servers this repo starts. */
const DEV_SIGNATURES = [
  "ts-node-dev",
  "vite",
  "next dev",
  "next-server",
  "concurrently",
];

const isWindows = process.platform === "win32";
const projectRoot = path.resolve(__dirname, "..");

const run = (cmd) => {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
};

/* ------------------------------- discovery ------------------------------- */

/** PIDs listening on a port. */
const pidsOnPort = (port) => {
  if (isWindows) {
    // No `-p TCP` here: Windows lists IPv6 under a separate "TCPv6" protocol,
    // and Vite binds to IPv6 loopback ([::1]:5173), so filtering by TCP alone
    // silently misses it.
    const out = run(`netstat -ano | findstr LISTENING | findstr :${port}`);
    return [
      ...new Set(
        out
          .split("\n")
          .map((line) => line.trim().split(/\s+/))
          // Exact match only — :5000 must not also catch :50001.
          .filter((cols) => cols[1]?.endsWith(`:${port}`))
          .map((cols) => cols[cols.length - 1])
          .filter((pid) => pid && pid !== "0")
      ),
    ];
  }

  return run(`lsof -ti tcp:${port} -sTCP:LISTEN`)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
};

/** All node processes, with their parent and command line. */
const listNodeProcesses = () => {
  if (isWindows) {
    const out = run(
      "powershell -NoProfile -Command \"Get-CimInstance Win32_Process -Filter \\\"Name='node.exe'\\\" | ForEach-Object { $_.ProcessId.ToString() + '|' + $_.ParentProcessId.ToString() + '|' + $_.CommandLine }\""
    );
    return out
      .split("\n")
      .map((line) => line.trim().split("|"))
      .filter((cols) => cols.length >= 2 && cols[0])
      .map(([pid, ppid, ...rest]) => ({
        pid,
        ppid,
        cmd: rest.join("|") || "",
      }));
  }

  return run("ps -eo pid=,ppid=,args=")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [pid, ppid, ...rest] = line.split(/\s+/);
      return { pid, ppid, cmd: rest.join(" ") };
    })
    .filter((p) => p.cmd.includes("node"));
};

const belongsToProject = (cmd) => {
  if (!cmd) return false;
  const normalised = cmd.replace(/\//g, "\\").toLowerCase();
  const root = projectRoot.replace(/\//g, "\\").toLowerCase();
  return normalised.includes(root);
};

const looksLikeDevServer = (cmd) =>
  DEV_SIGNATURES.some((sig) => cmd?.toLowerCase().includes(sig));

/* -------------------------------- killing -------------------------------- */

/** Kills a process and everything it spawned. */
const killTree = (pid) => {
  try {
    if (isWindows) {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
    } else {
      // Negative PID targets the process group, catching respawned children.
      try {
        process.kill(-Number(pid), "SIGKILL");
      } catch {
        process.kill(Number(pid), "SIGKILL");
      }
    }
    return true;
  } catch {
    return false;
  }
};

/* --------------------------------- main --------------------------------- */

const processes = listNodeProcesses();
const byPid = new Map(processes.map((p) => [p.pid, p]));

/**
 * From a listening process, walk up to the highest ancestor that is still one
 * of this project's dev processes — that's the supervisor doing the respawning.
 */
const resolveSupervisor = (pid) => {
  let current = byPid.get(pid);
  if (!current) return pid;

  let topmost = current;
  const seen = new Set([pid]);

  while (current?.ppid && !seen.has(current.ppid)) {
    const parent = byPid.get(current.ppid);
    if (!parent) break;
    if (!belongsToProject(parent.cmd) && !looksLikeDevServer(parent.cmd)) break;

    seen.add(parent.pid);
    topmost = parent;
    current = parent;
  }

  return topmost.pid;
};

/**
 * PID → the ports it accounts for. One supervisor often covers several: when
 * the stack runs under `concurrently`, all three servers share an ancestor.
 */
const targets = new Map();

const addTarget = (pid, label) => {
  if (!targets.has(pid)) targets.set(pid, new Set());
  targets.get(pid).add(label);
};

// 1. Whatever is holding one of our ports (resolved up to its supervisor).
for (const { port, name } of PORTS) {
  for (const pid of pidsOnPort(port)) {
    addTarget(resolveSupervisor(pid), `${name} :${port}`);
  }
}

// 2. Any stray dev server for this repo that isn't currently listening.
for (const proc of processes) {
  if (belongsToProject(proc.cmd) && looksLikeDevServer(proc.cmd)) {
    if (!targets.has(proc.pid)) addTarget(proc.pid, "stray dev server");
  }
}

if (targets.size === 0) {
  console.log("\n✔ Nothing to stop — all dev ports are free.\n");
  process.exit(0);
}

let stopped = 0;
// Which ports were actually occupied before we started killing.
const wasOccupied = PORTS.filter(({ port }) => pidsOnPort(port).length > 0);

for (const [pid] of targets) {
  // A supervisor's tree often takes its siblings with it, so a later kill
  // failing just means that process is already gone.
  if (killTree(pid)) stopped += 1;
}

// Give the OS a moment to release the sockets before reporting.
const deadline = Date.now() + 5000;
let stillHeld = PORTS.filter(({ port }) => pidsOnPort(port).length > 0);
while (Date.now() < deadline && stillHeld.length > 0) {
  stillHeld = PORTS.filter(({ port }) => pidsOnPort(port).length > 0);
}

for (const { port, name } of PORTS) {
  const held = stillHeld.some((p) => p.port === port);
  const wasBusy = wasOccupied.some((p) => p.port === port);

  if (held) console.log(`  ✖ ${name.padEnd(8)} :${port} — still in use`);
  else if (wasBusy) console.log(`  ✔ ${name.padEnd(8)} :${port} — freed`);
  else console.log(`  · ${name.padEnd(8)} :${port} — was already free`);
}

if (stillHeld.length > 0) {
  console.log(
    "\n⚠ Something outside this project is using those ports — check with:"
  );
  console.log(
    isWindows
      ? `    netstat -ano | findstr :${stillHeld[0].port}\n`
      : `    lsof -i :${stillHeld[0].port}\n`
  );
  process.exit(1);
}

console.log(
  stopped > 0
    ? "\n✔ All dev ports are free. You can run `npm run dev` now.\n"
    : "\n✔ Nothing was running. You can run `npm run dev` now.\n"
);
