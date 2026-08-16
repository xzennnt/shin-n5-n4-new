import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

async function extractAnswers() {
  const worker = await createWorker('jpn');
  const results = {};
  
  // Just testing the first 5 questions to see if it works
  const files = [
    'w1-d1-q001-answer.png',
    'w1-d1-q002-answer.png',
    'w1-d1-q003-answer.png',
    'w1-d1-q004-answer.png',
    'w1-d1-q005-answer.png'
  ];

  for (const file of files) {
    const fullPath = path.join(process.cwd(), 'public', 'pdf-crops', file);
    if (!fs.existsSync(fullPath)) {
      console.log(`File missing: ${file}`);
      continue;
    }
    const { data: { text } } = await worker.recognize(fullPath);
    console.log(`${file}:\n${text.trim()}\n---`);
  }
  
  await worker.terminate();
}

extractAnswers().catch(console.error);