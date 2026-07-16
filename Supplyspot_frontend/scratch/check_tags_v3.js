
import fs from 'fs';

const content = fs.readFileSync('src/components/GoodsReceipts.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
// Improved regex to only match JSX/HTML tags:
// 1. Must start with < and then either / or an HTML tag name (lowercase) or Component name (Uppercase)
// 2. Must NOT be followed by = or { (which would be < comparison or generic)
// 3. Must be a complete tag or start of tag
// Actually, a better way is to look for common JSX components and lowercase tags.
const tagRegex = /<\/?([A-Z][A-Z0-9]*|[a-z][a-z0-9]*)(?:\s+[^>]*?)?>/g;

lines.forEach((line, i) => {
    const lineNumber = i + 1;
    // Remove matches that are likely TypeScript generics: e.g. <Set<number>>, <any>, <string[]>
    // A heuristic: if it contains [ or ], or is followed by (, it's likely not a tag in this context.
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];

        // Skip obvious non-tags
        if (fullTag.includes('<Set') || fullTag.includes('<any') || fullTag.includes('<string') || fullTag.includes('<number')) continue;
        if (fullTag.endsWith('/>')) continue; // Self-closing

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
