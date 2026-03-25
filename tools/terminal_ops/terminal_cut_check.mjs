#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || '.';

const issues = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (p.endsWith('.js')) {
      const txt = fs.readFileSync(p, 'utf8');
      const imports = [...txt.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g)].map(m => m[1]);
      for (const imp of imports) {
        if (imp.startsWith('.')) {
          const target = path.resolve(path.dirname(p), imp);
          if (!fs.existsSync(target) && !fs.existsSync(target + '.js')) {
            issues.push({ type: 'missing-import', file: p, target: imp });
          }
        }
      }
    }
  }
}

walk(root);

console.log(JSON.stringify({ issues }, null, 2));
process.exit(issues.length ? 1 : 0);
