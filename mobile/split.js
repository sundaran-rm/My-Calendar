const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  fs.writeFileSync('style.css', styleMatch[1]);
} else {
  console.log('No <style> found.');
}

const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  fs.writeFileSync('app.js', scriptMatch[1]);
} else {
  console.log('No <script> found.');
}

let newHtml = content.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="style.css">');
newHtml = newHtml.replace(/<script>[\s\S]*?<\/script>/, '<script src="app.js"></script>');
fs.writeFileSync('index.html', newHtml);
console.log('File split successfully.');
