const fs = require('fs');

const path = 'src/components/settings/TeamManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/variant: "destructive"/g, 'variant: "error"');

fs.writeFileSync(path, content, 'utf8');
