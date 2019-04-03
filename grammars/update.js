#!/usr/bin/env node

// Updates the storysript CSON file from the submodule

const CSON = require('cson');
const fs = require('fs');
const path = require('path');

const root_dir = path.join(__dirname, '..');

const grammar = path.join(root_dir, 'syntax-highlighter/dist/atom/grammars/storyscript.cson');
const grammarJSON = path.join(root_dir, 'grammars', 'storyscript.cson');

console.log(`Reading: ${grammar}`);

const input = fs.readFileSync(grammar, 'utf8');
const result = CSON.parse(input);

// fixup the scopeName
result.scopeName = 'source.story';

console.log(`Writing: ${grammarJSON}`);
const text = CSON.stringify(result, null, 2);
fs.writeFileSync(grammarJSON, text);
