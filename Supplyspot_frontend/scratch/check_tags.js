
import fs from 'fs';

const content = fs.readFileSync('src/components/GoodsReceipts.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    const lineNumber = i + 1;
    // Simple regex to find <div or </div>
    // Note: this is a heuristic and might miss some complex cases
    const opens = line.match(/<div(?![^>]*\/>)[^>]*>/g) || [];
    const closes = line.match(/<\/div>/g) || [];

    opens.forEach(o => stack.push({ type: 'open', line: lineNumber }));
    closes.forEach(c => {
        if (stack.length > 0) {
            stack.pop();
        } else {
            console.log(`Extra close at line ${lineNumber}`);
        }
    });
});

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed open at line ${s.line}`));
}
