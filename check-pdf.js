import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('public/shin_nihongo_500_N4_N5.pdf');

pdf(dataBuffer).then(function(data) {
    console.log("Pages:", data.numpages);
    const text = data.text;
    if (text.includes('前のページのこたえ')) {
        console.log("Found text!");
        const matches = text.match(/前のページのこたえ[ \d]+/g);
        console.log(matches ? matches.slice(0, 5) : "No specific match");
    } else {
        console.log("Not found '前のページのこたえ'");
    }
}).catch(console.error);
