const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components', 'ui');
const files = fs.readdirSync(dir);

let count = 0;
files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const updated = content.replace(/(from\s+['"])([^'"]+?)@[0-9][^'"]*?(['"])/g, '$1$2$3');
    if (content !== updated) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log('Cleaned imports in:', file);
      count++;
    }
  }
});

console.log(`Successfully cleaned ${count} UI component files.`);
