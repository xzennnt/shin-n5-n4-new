import fs from 'fs';
import path from 'path';

const answersPath = path.join(process.cwd(), 'src', 'answers.json');
const answers = JSON.parse(fs.readFileSync(answersPath, 'utf8'));

const patches = {
  'w1-d2-q018': 1,
  'w1-d2-q021': 1,
  'w1-d3-q033': 2,
  'w1-d3-q043': 3,
  'w1-d4-q060': 1,
  'w1-d6-q087': 3,
  'w2-d4-q174': 0,
  'w2-d4-q184': 2,
  'w3-d2-q279': 2,
  'w3-d3-q294': 1,
  'w4-d4-q434': 0
};

Object.assign(answers, patches);
fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));
console.log('Patched the remaining 11 answers.');
