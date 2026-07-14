const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'src')
];

const apiJsPath = path.join(__dirname, 'src', 'services', 'api.js');

function processFile(filePath) {
  if (filePath === apiJsPath || filePath.endsWith('replace_fetch.js') || filePath.endsWith('.json') || filePath.endsWith('.png')) return;
  
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if it doesn't have fetch(
  if (!content.includes('fetch(') && !content.includes('fetch (')) {
    return;
  }

  // Determine relative path to src/services/api.js
  const dirPath = path.dirname(filePath);
  let relativePath = path.relative(dirPath, apiJsPath);
  
  // Format relative path for import (remove .js, ensure starts with .)
  relativePath = relativePath.replace(/\\/g, '/').replace('.js', '');
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  // Add import if not present
  if (!content.includes('apiFetch')) {
    // If it already imports from api.js (like BASE_URL), append apiFetch to it
    if (content.includes(relativePath)) {
      content = content.replace(new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"]${relativePath}['"];?`), (match, p1) => {
        if (!p1.includes('apiFetch')) {
          return `import {${p1}, apiFetch} from '${relativePath}';`;
        }
        return match;
      });
    } else {
      // Otherwise add a new import at the top
      content = `import { apiFetch } from '${relativePath}';\n` + content;
    }
  }

  // Replace fetch( with apiFetch(
  content = content.replace(/\bfetch\s*\(/g, 'apiFetch(');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

targetDirs.forEach(dir => traverseDir(dir));
console.log('Done!');
