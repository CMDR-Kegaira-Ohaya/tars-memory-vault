#!/usr/bin/env node
import fs from 'fs';

const file = process.argv[2];
const symbol = process.argv[3];

const txt = fs.readFileSync(file, 'utf8');

const fnRegex = new RegExp(`function\\s+${symbol}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}`, 'm');
const match = txt.match(fnRegex);

console.log(JSON.stringify({
  file,
  symbol,
  found: !!match,
  body: match ? match[0] : null
}, null, 2));
