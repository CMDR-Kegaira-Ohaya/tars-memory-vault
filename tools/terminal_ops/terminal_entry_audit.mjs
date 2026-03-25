#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const filePath = process.argv[2] || 'terminal/index.html';
const html = fs.readFileSync(filePath, 'utf8');

const scriptMatches = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
const cssMatches = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]);
const uiV3Refs = scriptMatches.filter(s => s.includes('ui-v3/'));

const duplicateWarnings = [];
const ownershipHints = new Map();
for (const s of scriptMatches) {
  const key = path.basename(s);
  if (ownershipHints.has(key)) duplicateWarnings.push(`duplicate script basename: ${key}`);
  ownershipHints.set(key, s);
}

console.log(JSON.stringify({
  file: filePath,
  css: cssMatches,
  jsEntrypoints: scriptMatches,
  uiV3Refs,
  duplicateWarnings,
}, null, 2));
