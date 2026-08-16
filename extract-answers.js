import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

async function extractAnswers() {
  const worker = await createWorker('jpn');
  const results = {};
  
  const files = fs.readdirSync(path.join(process.cwd(), 'public', 'pdf-crops'))
    .filter(f => f.endsWith('-answer.png'))
    .sort();

  console.log(`Found ${files.length} answer files. Processing...`);

  // We process in chunks to speed up if needed, but linear is fine for 496 if we just wait
  // Actually let's do a fast pass: Tesseract can be parallelized, but since we are memory constrained,
  // we do it sequentially. It takes about 1-2 sec per image, so 496 images * 1.5s = ~12 minutes.
  // Wait, that's too long! We might hit a timeout.
  // Is there a way to speed this up? Tesseract can just look at the top 10% of the image.
  // But wait, the image is already a crop of the answer box. 
  
  // Let's create multiple workers.
  const numWorkers = 4;
  const workers = await Promise.all(
    Array(numWorkers).fill(0).map(() => createWorker('jpn'))
  );
  
  let i = 0;
  const promises = files.map((file, index) => {
    return async () => {
      const workerInstance = workers[index % numWorkers];
      const fullPath = path.join(process.cwd(), 'public', 'pdf-crops', file);
      const { data: { text } } = await workerInstance.recognize(fullPath);
      
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      let ans = null;
      for (const line of lines) {
        // Try to match the pattern: numbers at the beginning
        // E.g., "1 3 この町" -> match[1] = 1, match[2] = 3
        const match = line.trim().match(/^(\d+)\s+(\d+)/);
        if (match) {
          ans = parseInt(match[2], 10);
          break;
        }
      }
      
      const qId = file.replace('-answer.png', '');
      if (ans !== null && ans >= 1 && ans <= 4) {
        results[qId] = ans - 1; // 0-indexed for our app
      } else {
        // Fallback or log if missing
        console.log(`Could not parse answer for ${file}. Text: ${lines[0]}`);
      }
      
      i++;
      if (i % 50 === 0) {
        console.log(`Processed ${i} / ${files.length}`);
      }
    };
  });

  // Run in chunks
  for (let j = 0; j < promises.length; j += numWorkers) {
    const chunk = promises.slice(j, j + numWorkers);
    await Promise.all(chunk.map(fn => fn()));
  }

  await Promise.all(workers.map(w => w.terminate()));
  
  fs.writeFileSync(path.join(process.cwd(), 'src', 'answers.json'), JSON.stringify(results, null, 2));
  console.log('Finished extracting answers!');
}

extractAnswers().catch(console.error);