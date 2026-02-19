const fs = require('fs');
const path = require('path');

const PID_FILE = path.resolve(__dirname, '../.server-pid');

module.exports = async function globalTeardown() {
  const pid = process.env._VV_SERVER_PID;
  if (!pid) {
    console.log('[global-teardown] No spawned server to stop');
    return;
  }

  console.log(`[global-teardown] Killing server pid=${pid}`);
  try {
    process.kill(Number(pid), 'SIGTERM');
  } catch {
    // already dead — ignore
  }

  // Clean up PID file
  try { fs.unlinkSync(PID_FILE); } catch { /* ignore */ }
};
