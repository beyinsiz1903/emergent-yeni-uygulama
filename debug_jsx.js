const fs = require('fs');

const content = fs.readFileSync('/app/frontend/src/pages/MobileHousekeeping.js', 'utf8');
const lines = content.split('\n');

let divStack = [];
let divCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Find opening divs
  const openDivMatches = line.match(/<div[^>]*>/g);
  if (openDivMatches) {
    openDivMatches.forEach(match => {
      divStack.push({ line: lineNum, content: match });
      divCount++;
    });
  }
  
  // Find closing divs
  const closeDivMatches = line.match(/<\/div>/g);
  if (closeDivMatches) {
    closeDivMatches.forEach(() => {
      if (divStack.length > 0) {
        divStack.pop();
        divCount--;
      } else {
        console.log(`Extra closing div at line ${lineNum}: ${line.trim()}`);
      }
    });
  }
}

console.log(`Remaining unclosed divs: ${divStack.length}`);
divStack.forEach(div => {
  console.log(`Unclosed div at line ${div.line}: ${div.content}`);
});