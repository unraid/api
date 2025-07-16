#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getRequiredVersion() {
  const nvmrcPath = path.join(__dirname, '..', '..', '.nvmrc');
  return fs.readFileSync(nvmrcPath, 'utf8').trim();
}

function getCurrentVersion() {
  return execSync('node -v', { encoding: 'utf8' }).trim().replace('v', '');
}

function checkNodeVersion() {
  try {
    const requiredVersion = getRequiredVersion();
    const currentVersion = getCurrentVersion();
    
    const [reqMajor, reqMinor, reqPatch] = requiredVersion.split('.').map(Number);
    const [curMajor, curMinor, curPatch] = currentVersion.split('.').map(Number);
    
    if (curMajor < reqMajor || 
        (curMajor === reqMajor && curMinor < reqMinor) ||
        (curMajor === reqMajor && curMinor === reqMinor && curPatch < reqPatch)) {
      console.error(`\x1b[31mError: Node.js version ${requiredVersion} or higher is required.\x1b[0m`);
      console.error(`\x1b[31mCurrent version: ${currentVersion}\x1b[0m`);
      console.error(`\x1b[33mPlease install Node.js ${requiredVersion} or use nvm to switch versions.\x1b[0m`);
      process.exit(1);
    }
    
    console.log(`\x1b[32m✓ Node.js version ${currentVersion} meets requirement (>= ${requiredVersion})\x1b[0m`);
  } catch (error) {
    console.error('Error checking Node.js version:', error.message);
    process.exit(1);
  }
}

checkNodeVersion();