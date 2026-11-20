import { readFile, readdir, writeFile } from 'node:fs/promises';

// Edit fragments in sections/, then regenerate their checked-in HTML.
const root = new URL('../', import.meta.url);
const check = process.argv.includes('--check');
const include = /<!-- include: (sections\/[a-z0-9-]+\.html) -->\n[\s\S]*?<!-- \/include -->/g;
const pages = (await readdir(root)).filter(name => name.endsWith('.html'));

for (const page of pages) {
  const url = new URL(page, root);
  const original = (await readFile(url, 'utf8')).replaceAll('\r\n', '\n');
  let rendered = original;

  for (const [block, path] of original.matchAll(include)) {
    const section = (await readFile(new URL(path, root), 'utf8'))
      .replaceAll('\r\n', '\n')
      .replace(/[ \t]+$/gm, '')
      .trimEnd();
    rendered = rendered.replace(block, () => `<!-- include: ${path} -->\n${section}\n<!-- /include -->`);
  }

  if (rendered === original) continue;
  if (check) {
    console.error(`${page} is out of date. Run node scripts/render-sections.mjs.`);
    process.exitCode = 1;
  } else {
    await writeFile(url, rendered);
  }
}
