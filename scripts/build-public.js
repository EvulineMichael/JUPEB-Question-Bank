// scripts/build-public.js  —  decides which files become public web pages.
//
// Vercel runs this on every deploy (see "buildCommand" in vercel.json) and
// publishes ONLY what it copies into public/. Everything else stays private:
// the question files in data/, backups-folder/, review/ and so on are never
// served, so nobody can download them by typing an address. api/papers.js still
// reads data/ on the server (vercel.json "includeFiles") after checking access.
//
// What gets published:
//   - site files in the top folder: .html .css .js .png .ico .jpg .svg .txt .xml
//     plus manifest.json (package.json and vercel.json are NOT published)
//   - the folders listed in PUBLIC_FOLDERS
// If you add a new FOLDER the site needs, add it to PUBLIC_FOLDERS.
// New files in the top folder (e.g. a new .js file) are picked up automatically.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public');

const PUBLIC_FOLDERS = ['images', 'notes', 'privacy'];
const PUBLIC_EXTENSIONS = ['.html', '.css', '.js', '.png', '.ico', '.jpg', '.jpeg', '.svg', '.webp', '.txt', '.xml'];
const PUBLIC_EXTRA_FILES = ['manifest.json'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

let count = 0;
for (const name of fs.readdirSync(root)) {
  const full = path.join(root, name);
  if (!fs.statSync(full).isFile()) continue;
  if (PUBLIC_EXTENSIONS.includes(path.extname(name).toLowerCase()) || PUBLIC_EXTRA_FILES.includes(name)) {
    fs.copyFileSync(full, path.join(out, name));
    count++;
  }
}
for (const folder of PUBLIC_FOLDERS) {
  const from = path.join(root, folder);
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, path.join(out, folder), { recursive: true });
  count++;
}

// Safety check: stop the deploy if a question file somehow ended up public.
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.json') && !PUBLIC_EXTRA_FILES.includes(path.relative(out, full))) {
      throw new Error('Refusing to publish a data file: ' + path.relative(out, full));
    }
  }
}
walk(out);

console.log(`Published ${count} files/folders to public/. Question files stay private.`);
