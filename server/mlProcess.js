const { spawn } = require("child_process");
const path = require("path");

let mlProcess = null;
let startedByUs = false;

function startMlProcess() {
  if (mlProcess) return;

  const mlDir = path.join(__dirname, "..", "ml");
  const isWin = process.platform === "win32";

  mlProcess = spawn(
    isWin ? "python" : "python3",
    ["-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", "8000"],
    {
      cwd: mlDir,
      stdio: "inherit",
      shell: false,
      env: process.env,
    }
  );

  startedByUs = true;

  mlProcess.on("exit", (code) => {
    if (code && code !== 0) {
      console.warn(`[ML] PyTorch service exited (code ${code})`);
    }
    mlProcess = null;
    startedByUs = false;
  });

  console.log("[ML] Starting PyTorch service on http://127.0.0.1:8000 ...");
}

function stopMlProcess() {
  if (!mlProcess || !startedByUs) return;
  mlProcess.kill();
  mlProcess = null;
  startedByUs = false;
}

async function ensureMlService(checkHealth) {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.ML_AUTO_START === "false") return;

  try {
    const online = await checkHealth();
    if (online) {
      console.log("[ML] PyTorch service already online (:8000)");
      return;
    }
  } catch {
    /* not running yet */
  }

  startMlProcess();
}

module.exports = { ensureMlService, stopMlProcess };
