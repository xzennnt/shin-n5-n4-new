import fs from 'fs';
import path from 'path';

const data = {
  // Week 1 Day 7
  91: 2, 92: 1, 93: 2, 94: 1, 95: 1, 96: 2,
  97: 1, 98: 2, 99: 1, 100: 2, 101: 1, 102: 2,
  103: 2, 104: 1, 105: 1, 106: 2, 107: 1, 108: 2,
  109: 1, 110: 1, 111: 1, 112: 1, 113: 1, 114: 2,
  115: 1, 116: 1, 117: 2, 118: 1, 119: 2, 120: 1,
  121: 1, 122: 1, 123: 2, 124: 1, 125: 1,

  // Week 2 Day 7
  216: 2, 217: 2, 218: 1, 219: 2, 220: 1, 221: 2,
  222: 2, 223: 1, 224: 2, 225: 1, 226: 2, 227: 1,
  228: 1, 229: 1, 230: 1, 231: 2, 232: 2, 233: 1,
  234: 1, 235: 2, 236: 2, 237: 1, 238: 1, 239: 2,
  240: 1, 241: 2, 242: 1, 243: 2, 244: 2, 245: 2,
  246: 2, 247: 1, 248: 1, 249: 1, 250: 2,

  // Week 3 Day 7
  341: 2, 342: 2, 343: 1, 344: 1, 345: 2, 346: 1,
  347: 1, 348: 2, 349: 1, 350: 2, 351: 2, 352: 1,
  353: 2, 354: 1, 355: 2, 356: 1, 357: 2, 358: 1,
  359: 2, 360: 1, 361: 2, 362: 2, 363: 1, 364: 1,
  365: 2, 366: 1, 367: 2, 368: 1, 369: 1, 370: 1,
  371: 2, 372: 2, 373: 1, 374: 2, 375: 1,

  // Week 4 Day 7
  466: 2, 467: 2, 468: 1, 469: 1, 470: 1, 471: 2,
  472: 2, 473: 2, 474: 2, 475: 1, 476: 1, 477: 1,
  478: 1, 479: 1, 480: 1, 481: 2, 482: 2, 483: 1,
  484: 1, 485: 1, 486: 2, 487: 1, 488: 1, 489: 2,
  490: 1, 491: 1, 492: 1, 493: 2, 494: 1, 495: 2,
  496: 1, 497: 1, 498: 2, 499: 1, 500: 2
};

const answersPath = path.join(process.cwd(), 'src', 'answers.json');
const answers = JSON.parse(fs.readFileSync(answersPath, 'utf8'));

let patchedCount = 0;
for (const [qNum, ansStr] of Object.entries(data)) {
  const ansVal = parseInt(ansStr, 10);
  const zIndexed = ansVal - 1; // 0 or 1
  
  const week = Math.ceil(parseInt(qNum, 10) / 125); 
  const qStr = String(qNum).padStart(3, '0');
  const qId = `w${week}-d7-q${qStr}`;
  
  answers[qId] = zIndexed;
  patchedCount++;
}

fs.writeFileSync(answersPath, JSON.stringify(answers, null, 2));
console.log(`Patched ${patchedCount} Day 7 answers successfully.`);
