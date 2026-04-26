const { spawnSync } = require('node:child_process');

const userArgs = process.argv.slice(2);

if (userArgs.length === 0) {
  console.error('Usage: node scripts/run-python.js <python args...>');
  process.exit(1);
}

const candidates = [];

if (process.env.PYTHON) {
  candidates.push({ command: process.env.PYTHON, args: [] });
}

if (process.platform === 'win32') {
  candidates.push(
    { command: 'python', args: [] },
    { command: 'py', args: ['-3'] },
    { command: 'python3', args: [] }
  );
} else {
  candidates.push(
    { command: 'python3', args: [] },
    { command: 'python', args: [] }
  );
}

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, [...candidate.args, ...userArgs], {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error && result.error.code === 'ENOENT') {
    continue;
  }

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

console.error(
  'Could not find a Python interpreter. Tried PYTHON, python, py -3, and python3.'
);
process.exit(1);
