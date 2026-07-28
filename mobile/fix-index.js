const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  // Add type="module" to script tags that have defer
  html = html.replace(/<script src="([^"]+)" defer><\/script>/g, '<script type="module" src="$1"></script>');
  // Add type="module" to script tags without defer if they don't already have type="module"
  html = html.replace(/<script src="([^"]+)"><\/script>/g, '<script type="module" src="$1"></script>');
  
  fs.writeFileSync(indexPath, html);
  console.log('Fixed index.html script tags to include type="module"');
} else {
  console.log('dist/index.html not found, skipping fix.');
}
