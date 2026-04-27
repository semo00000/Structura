const fs = require('fs');
let content = fs.readFileSync('src/components/AppSidebar.tsx', 'utf8');

// remove duplicate icon code if it exists for logout
content = content.replace(/<\/Button>\s*<\/TooltipTrigger>\s*>[\s\S]*?<Loader2 className="size-4 animate-spin" \/>[\s\S]*?: \([\s\S]*?<LogOut className="size-4" \/>[\s\S]*?\)[\s\S]*?\}[\s\S]*?<\/TooltipTrigger>/g, '</Button>\n            </TooltipTrigger>');

// remove duplicate icon code for login
content = content.replace(/<\/Link>\s*<\/Button>\s*<\/TooltipTrigger>\s*>\s*<LogIn className="size-4" \/>\s*<\/TooltipTrigger>/g, '</Link>\n              </Button>\n            </TooltipTrigger>');

fs.writeFileSync('src/components/AppSidebar.tsx', content, 'utf8');
