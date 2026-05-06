const { spawn } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT = path.join(__dirname, 'python', 'ml_engine.py');

function runPython(command, payload) {
  return new Promise((resolve, reject) => {
    const pythonCommand = process.env.PYTHON_BIN || 'python';
    const child = spawn(pythonCommand, [PYTHON_SCRIPT, command], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python ML process exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Python ML returned invalid JSON: ${error.message}`));
      }
    });

    child.stdin.end(JSON.stringify(payload || {}));
  });
}

module.exports = { runPython };
