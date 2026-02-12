const fs = require('fs');

// Read the file
const content = fs.readFileSync('seed-recipes-expanded.js', 'utf8');

// Replace all 'mock' sources with alternating Coles and Woolworths
let counter = 0;
const updated = content.replace(/source: 'mock'/g, () => {
  const sources = ['coles', 'woolworths'];
  const source = sources[counter % 2];
  counter++;
  return `source: '${source}'`;
});

// Write back
fs.writeFileSync('seed-recipes-expanded.js', updated);
console.log(`✓ Updated ${counter} ingredient sources`);
