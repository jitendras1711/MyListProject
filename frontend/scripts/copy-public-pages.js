const fs = require('fs');
const path = require('path');

const pages = [
  'privacy-policy',
  'terms',
  'delete-account',
  'calendar-notes-privacy-policy',
];
const sourceDirectory = path.join(__dirname, '..', 'public');
const outputDirectory = path.join(__dirname, '..', 'dist');

for (const page of pages) {
  const source = path.join(sourceDirectory, `${page}.html`);
  const destination = path.join(outputDirectory, `${page}.html`);
  fs.copyFileSync(source, destination);
}

console.log(`Copied ${pages.length} public legal pages to dist.`);
