
import fs from 'fs';

const content = fs.readFileSync('src/components/GoodsReceipts.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
const tagRegex = /<\/?([a-zA-Z0-9]+)(?![^>]*\/>)[^>]*>/g;

lines.forEach((line, i) => {
    const lineNumber = i + 1;
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];
        if (fullTag.startsWith('</')) {
            if (stack.length > 0) {
                const last = stack.pop();
                if (last.name !== tagName) {
                    console.log(`Mismatched close tag: expected </${last.name}> (from line ${last.line}), found ${fullTag} at line ${lineNumber}`);
                }
            } else {
                console.log(`Extra close tag: ${fullTag} at line ${lineNumber}`);
            }
        } else {
            stack.push({ name: tagName, line: lineNumber });
        }
    }
});

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed open tag: <${s.name}> at line ${s.line}`));
}
