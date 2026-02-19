const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PID_FILE = path.resolve(__dirname, '../.server-pid');
const HEALTH_URL = 'http://127.0.0.1:9097/api/health';

/** Check if server is listening */
function isServerUp() {
  return new Promise((resolve) => {
    http.get(HEALTH_URL, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

/** Wait for server to become ready */
function waitForServer(timeoutMs = 15_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Server not ready after ${timeoutMs}ms`));
      }
      isServerUp().then((up) => {
        if (up) return resolve();
        setTimeout(check, 500);
      });
    };
    check();
  });
}

module.exports = async function globalSetup() {
  // Kill any orphaned server from a previous run
  if (fs.existsSync(PID_FILE)) {
    const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10);
    try { process.kill(oldPid, 'SIGTERM'); } catch { /* already dead */ }
    fs.unlinkSync(PID_FILE);
    // Wait a moment for port to be released
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (await isServerUp()) {
    console.log('[global-setup] Server already running (external)');
    // Mark that we did NOT spawn it — don't kill on teardown
    return;
  }

  console.log('[global-setup] Starting server...');
  const serverDir = path.resolve(__dirname, '../..');
  const proc = spawn('node', ['server.js'], {
    cwd: serverDir,
    stdio: 'pipe',
    detached: false,
    env: { ...process.env },
  });

  proc.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  proc.stderr.on('data', (d) => process.stderr.write(`[server:err] ${d}`));

  // Save PID to file for cross-run cleanup & for teardown
  fs.writeFileSync(PID_FILE, String(proc.pid));
  process.env._VV_SERVER_PID = String(proc.pid);

  await waitForServer();
  console.log('[global-setup] Server ready');
};
