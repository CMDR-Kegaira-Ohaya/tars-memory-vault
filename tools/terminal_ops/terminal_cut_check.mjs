#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.argv[2] || 'terminal';
const issues = [];

function resolveRelativeModule(baseFile, specifier) {
  const baseDir = path.dirname(baseFile);
  const rawTarget = path.resolve(baseDir, specifier);
  const candidates = [
    rawTarget,
    `${rawTarget}.js`,
    `${rawTarget}.mjs`,
    path.join(rawTarget, 'index.js'),
    path.join(rawTarget, 'index.mjs'),
  ];
  return candidates.find(candidate => fs.existsSync(candidate));
}

function checkHtmlAssets(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const refs = [
    ...[...txt.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => ({ type: 'script', target: m[1] })),
    ...[...txt.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => ({ type: 'link', target: m[1] })),
  ];

  for (const ref of refs) {
    if (/^(https?:)?\/\//.test(ref.target) || ref.target.startsWith('data:')) continue;
    const resolved = path.resolve(path.dirname(filePath), ref.target);
    if (!fs.existsSync(resolved)) {
      issues.push({
        type: 'missing-html-asset',
        file: filePath,
        assetType: ref.type,
        target: ref.target,
      });
    }
  }
}

function checkJsImports(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const imports = [
    ...txt.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g),
    ...txt.matchAll(/import\(['"](.+?)['"]\)/g),
  ].map(m => m[1]);

  for (const imp of imports) {
    if (!imp.startsWith('.')) continue;
    const resolved = resolveRelativeModule(filePath, imp);
    if (!resolved) {
      issues.push({ type: 'missing-import', file: filePath, target: imp });
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p);
      continue;
    }

    if (p.endsWith('.html')) checkHtmlAssets(p);
    if (p.endsWith('.js') || p.endsWith('.mjs')) checkJsImports(p);
  }
}

walk(root);

console.log(JSON.stringify({ issues }, null, 2));
process.exit(issues.length ? 1 : 0);
