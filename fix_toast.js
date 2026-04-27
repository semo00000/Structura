const fs = require('fs');

const path = 'src/components/settings/TeamManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/variant: "error"/g, 'variant: "destructive"');

fs.writeFileSync(path, content, 'utf8');
