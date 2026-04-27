const fs = require('fs');

const path = 'src/components/AppSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Base-UI TooltipTrigger uses `render` prop for its child element instead of `asChild`. Let's put back the `render` props that I changed.
content = content.replace(/<TooltipTrigger asChild>(\{lockedContent\})<\/TooltipTrigger>/g, '<TooltipTrigger render=$1 />');
content = content.replace(/<TooltipTrigger asChild>(\{linkContent\})<\/TooltipTrigger>/g, '<TooltipTrigger render=$1 />');

content = content.replace(/<TooltipTrigger asChild>\s*<Button\s+type="button"\s+variant="ghost"\s+size="icon-sm"\s+className="w-full text-sidebar-foreground\/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"\s+onClick=\{([^}]+)\}\s+disabled=\{isLoggingOut\}\s*>\s*(.*?)\s*<\/Button>\s*<\/TooltipTrigger>/gs,
`<TooltipTrigger render={<Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                onClick={$1}
                disabled={isLoggingOut}
              />} />`
);

content = content.replace(/<TooltipTrigger asChild>\s*<Button\s+variant="ghost"\s+size="icon-sm"\s+className="w-full text-sidebar-foreground\/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"\s+asChild\s*>\s*<Link href="\/login">\s*<LogIn className="size-4" \/>\s*<\/Link>\s*<\/Button>\s*<\/TooltipTrigger>/gs,
`<TooltipTrigger render={<Button
                variant="ghost"
                size="icon-sm"
                className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                nativeButton={false}
                render={<Link href="/login" />}
              ><LogIn className="size-4" /></Button>} />`
);

fs.writeFileSync(path, content, 'utf8');
