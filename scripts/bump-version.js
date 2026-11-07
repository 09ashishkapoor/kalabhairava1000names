const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const vfile = path.join(__dirname, '..', 'public', 'version.json');

if (!fs.existsSync(vfile)) {
  console.error('version.json not found.');
  process.exit(1);
}

const raw = fs.readFileSync(vfile, 'utf8').replace(/^\uFEFF/, '');
let obj;
try {
  obj = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse version.json:', e.message);
  process.exit(1);
}

const parts = (obj.version || '1.1').split('.');
const major = parseInt(parts[0] || '1', 10);
const minor = parseInt(parts[1] || '0', 10);
const newMinor = minor + 1;
const newVersion = `${major}.${newMinor}`;
const today = new Date().toISOString().slice(0, 10);

const newObj = {
  version: newVersion,
  buildDate: today
};

// write file
fs.writeFileSync(vfile, JSON.stringify(newObj, null, 2) + '\n', 'utf8');
console.log(`version.json updated to ${newVersion} (${today})`);

const shouldCommit = process.env.BUMP_VERSION_COMMIT !== 'false';

if (!shouldCommit) {
  console.log('Skipping git commit because BUMP_VERSION_COMMIT=false.');
} else {
  try {
    execSync('git add public/version.json', { stdio: 'inherit' });
    // commit with skip tag to avoid retriggering workflows
    execSync(`git commit -m "chore: auto-increment version to ${newVersion} [skip version]"`, { stdio: 'inherit' });
    console.log('Committed version bump.');
  } catch (err) {
    // if no changes or commit failed, show message and exit 0 to avoid hook failure
    console.log('No commit made (maybe no changes or commit failed).', err.message || '');
  }
}
