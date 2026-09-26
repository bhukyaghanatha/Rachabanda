import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');

function getAllFiles(dir, exts = ['.tsx', '.ts', '.jsx', '.js']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getAllFiles(SRC_DIR);
console.log(`Auditing ${files.length} source files for accessibility...`);

let issuesFound = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(process.cwd(), file);

  // 1. Check img tags without alt
  const imgRegex = /<img\b([\s\S]*?)(\/?>)/g;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const attrs = match[1];
    if (!attrs.includes('alt=')) {
      console.warn(`[MISSING ALT] ${relPath}: <img ${attrs.slice(0, 40).replace(/\s+/g, ' ')}...>`);
      issuesFound++;
    }
  }

  // 2. Check labels without htmlFor
  const labelRegex = /<label\b([\s\S]*?)>/g;
  while ((match = labelRegex.exec(content)) !== null) {
    const attrs = match[1];
    if (!attrs.includes('htmlFor=') && !attrs.includes('htmlFor =')) {
      const nextSlice = content.slice(match.index, match.index + 200);
      if (!nextSlice.includes('<input') && !nextSlice.includes('<select') && !nextSlice.includes('<textarea')) {
        console.warn(`[LABEL WITHOUT htmlFor] ${relPath}: <label ${attrs.slice(0, 40).replace(/\s+/g, ' ')}...>`);
        issuesFound++;
      }
    }
  }

  // 3. Check inputs/selects/textareas without id or aria-label
  const inputRegex = /<(input|textarea|select)\b([\s\S]*?)(\/?>)/g;
  while ((match = inputRegex.exec(content)) !== null) {
    const tag = match[1];
    const attrs = match[2];
    const isHidden = attrs.includes('type="hidden"') || attrs.includes("type='hidden'");
    if (isHidden) continue;

    const hasId = attrs.includes('id=') || attrs.includes('id =');
    const hasAriaLabel = attrs.includes('aria-label=') || attrs.includes('aria-labelledby=');
    const hasTitle = attrs.includes('title=');

    if (!hasId && !hasAriaLabel && !hasTitle) {
      console.warn(`[UNLABELLED INPUT] ${relPath}: <${tag} ${attrs.slice(0, 50).replace(/\s+/g, ' ')}...>`);
      issuesFound++;
    }
  }

  // 4. Check buttons without accessible name (neither aria-label/title nor text content)
  // Matches <button ...> ... </button>
  const buttonRegex = /<button\b([\s\S]*?)>([\s\S]*?)<\/button>/g;
  while ((match = buttonRegex.exec(content)) !== null) {
    const attrs = match[1];
    const inner = match[2].trim();

    const hasAriaLabel = attrs.includes('aria-label=') || attrs.includes('aria-labelledby=');
    const hasTitle = attrs.includes('title=');

    // Remove JSX comments and SVG/elements to see if text remains
    const textOnly = inner
      .replace(/<[^>]+>/g, '') // remove HTML tags
      .replace(/\{[^}]+\}/g, '') // remove JS expressions
      .trim();

    // If there is no visible text and no aria-label and no title
    if (!hasAriaLabel && !hasTitle && textOnly.length === 0) {
      // Check if button contains an expression that renders text (e.g. {tab.label})
      if (!inner.includes('{') || inner.includes('className')) {
        console.warn(`[ICON-ONLY BUTTON WITHOUT ACCESSIBLE NAME] ${relPath}: <button ${attrs.slice(0, 50).replace(/\s+/g, ' ')}...>${inner.slice(0, 40).replace(/\s+/g, ' ')}</button>`);
        issuesFound++;
      }
    }
  }
}

console.log(`\nAccessibility Static Audit Complete: ${issuesFound} issues identified.`);
if (issuesFound > 0) {
  process.exit(1);
} else {
  console.log('All checked rules passed cleanly!');
  process.exit(0);
}
