const fs = require('fs');

// Read the JSON file
const filePath = '../web/.nuxt/nuxt-custom-elements/dist/unraid-components/manifest.json';
const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Add timestamp (ts) to the JSON data
const timestamp = Math.floor(new Date().getTime() / 1000); // Current timestamp epoch
jsonData.ts = timestamp;

// Write the updated JSON back to the file
fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

console.log(`Timestamp: ${timestamp} added to the web component manifest.`);
