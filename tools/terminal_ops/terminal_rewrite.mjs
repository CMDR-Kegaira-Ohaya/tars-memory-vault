#!/usr/bin/env node
import fs from 'fs';

const file = process.argv[2];
const symbol = process.argv[3];

const lines = fs.readFileSync(file, 'utf8').split('\n');
const filtered = lines.filter(l => !l.includes(symbol));

fs.writeFileSync(file, filtered.join('\n'));
console.log(JSON.stringify({ file, removed: symbol }));
